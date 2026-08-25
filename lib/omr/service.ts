import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getAuthContext, requireAuth } from '@/lib/auth/session';
import { resolveOrCreateStudent } from '@/lib/examination/studentRoster';
import { normalizeChoiceKey } from '@/lib/examination/answerKey';
import prisma from '@/lib/prisma';

const execFileAsync = promisify(execFile);

const OMR_ROOT = path.join(process.cwd(), 'integrations', 'omr-cg');
const OMR_WORK_ROOT = path.join(os.tmpdir(), 'question-bank-omr');
const LOCAL_OMR_PYTHON = path.join(process.cwd(), '.venv-omr', 'bin', 'python');
const OPTION_LABELS = 'ABCDEFGH';
const OMR_SERVICE_TOKEN_HEADER = 'x-omr-service-token';

type OmrQuestionType = 'MCQ' | 'MSQ' | 'TRUEFALSE' | 'FIB';

interface OmrSpecQuestion {
    no: number;
    type: OmrQuestionType;
    options?: number;
}

interface OmrSpec {
    paper_id: string;
    exam_name: string;
    subject: string;
    duration_min: number;
    max_marks: number;
    roll_digits: number;
    version: number;
    instructions: string[];
    questions: OmrSpecQuestion[];
}

export interface OmrDraftQuestion {
    no: number;
    optionCount: number;
    questionType?: string | null;
}

export interface OmrDraftInput {
    paperId: string;
    examName: string;
    subject: string;
    durationMin: number;
    maxMarks: number;
    questions: OmrDraftQuestion[];
}

interface PythonGenerateSummary {
    ok: boolean;
    paper_id: string;
    version: number;
    pdf: string;
    page_count: number;
    question_count: number;
    fib_count: number;
    artifacts: string[];
    error?: string;
}

interface RemoteFile {
    path: string;
    content_b64: string;
}

interface RemoteGenerateResponse {
    ok: boolean;
    summary?: PythonGenerateSummary;
    files?: RemoteFile[];
    error?: string;
}

export interface OmrDetectionResponse {
    field: string;
    question_no: number;
    type: OmrQuestionType;
    detected: string;
    filled: string[];
    fill_ratios: Record<string, number>;
    confidence: number;
    is_ambiguous: boolean;
    reason?: string;
}

export interface OmrDetectionResult {
    ok: boolean;
    status: string;
    paper_id?: string;
    version?: number;
    page?: number;
    warnings: string[];
    quality: {
        blur_score?: number;
        blur_floor?: number;
        marker_scores?: number[];
        roll_number?: string;
    };
    responses: OmrDetectionResponse[];
    needs_review: boolean;
    warped_png_b64?: string;
    overlay_png_b64?: string;
    fib_crops?: Array<{ question_no: number; png_b64?: string }>;
}

export interface OmrScanInput {
    image: Buffer;
    filename?: string;
}

export type OmrAnswerGradeStatus = 'correct' | 'incorrect' | 'unanswered' | 'no_key' | 'review';

export interface OmrGradedAnswer {
    questionNumber: number;
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    confidence: number;
    marks: number;
    earnedMarks: number;
    isCorrect: boolean;
    isAmbiguous: boolean;
    status: OmrAnswerGradeStatus;
}

export interface OmrGradeSummary {
    score: number;
    totalMarks: number;
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
    answers: OmrGradedAnswer[];
}

interface OmrSourceQuestion {
    id: string;
    question_text: string;
    options: string[];
    answer: string | null;
    question_type: string | null;
}

type OmrTest = Awaited<ReturnType<typeof getOwnedTestForOmr>>;

export interface GenerateOmrSheetResult {
    test: NonNullable<OmrTest>;
    spec: OmrSpec;
    layoutDir: string;
    pdfPath: string;
    summary: PythonGenerateSummary;
}

export interface SaveDetectedResponseArgs {
    name: string;
    className: string;
    rollNumber?: string;
    timeTaken?: number;
}

function normalizeQuestionType(questionType: string | null, optionCount: number): OmrQuestionType {
    const type = (questionType ?? '').toUpperCase();

    if (type.includes('FIB') || type.includes('FILL')) return 'FIB';
    if (type.includes('TRUE') || type.includes('FALSE')) return 'TRUEFALSE';
    if ((type.includes('MULTIPLE') || type.includes('MSQ')) && !type.includes('SINGLE')) return 'MSQ';
    if (optionCount <= 1) return 'FIB';

    return 'MCQ';
}

function sourceForTestQuestion(testQuestion: NonNullable<OmrTest>['questions'][number]): OmrSourceQuestion {
    const source = testQuestion.question ?? testQuestion.schoolTestQuestion;
    if (!source) {
        throw new Error(`Question ${testQuestion.questionNumber} has no source question`);
    }
    return source;
}

function normalizeDetectedAnswer(answer: string | null, optionCount: number): string {
    const labels = OPTION_LABELS.slice(0, Math.max(0, Math.min(optionCount, OPTION_LABELS.length))).split('');
    return (answer ?? '')
        .toUpperCase()
        .replace(/[\s,.;:/()\[\]{}_-]+/g, '')
        .split('')
        .filter((label) => labels.includes(label))
        .filter((label, index, all) => all.indexOf(label) === index)
        .sort((a, b) => labels.indexOf(a) - labels.indexOf(b))
        .join('');
}

function toOmrSpec(test: NonNullable<OmrTest>): OmrSpec {
    const questions = test.questions.map((testQuestion) => {
        const source = sourceForTestQuestion(testQuestion);
        const optionCount = source.options?.length ?? 0;
        const type = normalizeQuestionType(source.question_type, optionCount);

        if ((type === 'MCQ' || type === 'MSQ') && (optionCount < 2 || optionCount > OPTION_LABELS.length)) {
            throw new Error(
                `Question ${testQuestion.questionNumber} has ${optionCount} options; OMR supports 2-${OPTION_LABELS.length}.`,
            );
        }

        const specQuestion: OmrSpecQuestion = {
            no: testQuestion.questionNumber,
            type,
        };

        if (type === 'MCQ' || type === 'MSQ') {
            specQuestion.options = optionCount;
        }

        return specQuestion;
    });

    return {
        paper_id: test.id,
        exam_name: test.title,
        subject: test.subject,
        duration_min: test.duration,
        max_marks: test.totalMarks,
        roll_digits: 6,
        version: 1,
        instructions: [
            'Use blue or black pen. Fill each bubble completely.',
            'Do not fold, tear, or mark outside the answer bubbles.',
            'Print this sheet at 100% scale only.',
        ],
        questions,
    };
}

function toDraftOmrSpec(input: OmrDraftInput): OmrSpec {
    const examName = input.examName.trim();
    const subject = input.subject.trim();

    if (!/^[A-Fa-f0-9]{24}$/.test(input.paperId)) throw new Error('The OMR paper ID is invalid');
    if (!examName) throw new Error('A test title is required for the OMR preview');
    if (!subject) throw new Error('A subject is required for the OMR preview');
    if (!Number.isInteger(input.durationMin) || input.durationMin <= 0) {
        throw new Error('Test duration must be a positive whole number');
    }
    if (!Number.isFinite(input.maxMarks) || input.maxMarks <= 0) {
        throw new Error('Total marks must be greater than zero');
    }
    if (input.questions.length === 0) throw new Error('Add at least one question to preview the OMR sheet');
    if (input.questions.length > 500) throw new Error('OMR preview supports up to 500 questions');

    const seenNumbers = new Set<number>();
    const questions = input.questions.map((question, index) => {
        if (!Number.isInteger(question.no) || question.no <= 0) {
            throw new Error(`Question ${index + 1} has an invalid question number`);
        }
        if (seenNumbers.has(question.no)) {
            throw new Error(`Question number ${question.no} is duplicated`);
        }
        seenNumbers.add(question.no);

        const type = normalizeQuestionType(question.questionType ?? null, question.optionCount);
        if ((type === 'MCQ' || type === 'MSQ') && (question.optionCount < 2 || question.optionCount > OPTION_LABELS.length)) {
            throw new Error(
                `Question ${question.no} has ${question.optionCount} options; OMR supports 2-${OPTION_LABELS.length}.`,
            );
        }

        return {
            no: question.no,
            type,
            ...((type === 'MCQ' || type === 'MSQ') ? { options: question.optionCount } : {}),
        } satisfies OmrSpecQuestion;
    });

    return {
        paper_id: input.paperId,
        exam_name: examName,
        subject,
        duration_min: input.durationMin,
        max_marks: input.maxMarks,
        roll_digits: 6,
        version: 1,
        instructions: [
            'Use blue or black pen. Fill each bubble completely.',
            'Do not fold, tear, or mark outside the answer bubbles.',
            'Print this sheet at 100% scale only.',
        ],
        questions,
    };
}

async function getOwnedTestForOmr(testId: string) {
    const ctx = await getAuthContext();
    // Access is decided by ORGANISATION, not authorship — see crudTest.ts.
    if (!ctx?.organizationId) {
        throw new Error('Unauthorized');
    }

    return prisma.test.findFirst({
        where: { id: testId, organizationId: ctx.organizationId },
        include: {
            questions: {
                orderBy: { questionNumber: 'asc' },
                include: {
                    question: {
                        select: {
                            id: true,
                            question_text: true,
                            options: true,
                            answer: true,
                            question_type: true,
                        },
                    },
                    schoolTestQuestion: {
                        select: {
                            id: true,
                            question_text: true,
                            options: true,
                            answer: true,
                            question_type: true,
                        },
                    },
                },
            },
        },
    });
}

function parsePythonJson<T>(stdout: string): T {
    const trimmed = stdout.trim();

    try {
        return JSON.parse(trimmed) as T;
    } catch (error) {
        const firstObject = trimmed.indexOf('{');
        const lastObject = trimmed.lastIndexOf('}');

        if (firstObject !== -1 && lastObject > firstObject) {
            try {
                return JSON.parse(trimmed.slice(firstObject, lastObject + 1)) as T;
            } catch {
                // Fall through to the clearer error below.
            }
        }

        const preview = trimmed.slice(0, 300);
        throw new Error(
            `OMR Python returned invalid JSON: ${error instanceof Error ? error.message : 'unknown error'}. Output started with: ${preview}`,
        );
    }
}

function normalizeRemoteOmrBaseUrl(url: string): string {
    return url
        .replace(/\/+$/, '')
        .replace(/\/api$/, '');
}

function getRemoteOmrBaseUrls(): string[] {
    const urls: string[] = [];
    const configured = process.env.OMR_SERVICE_URL?.trim();
    if (configured) urls.push(normalizeRemoteOmrBaseUrl(configured));

    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (productionUrl) urls.push(normalizeRemoteOmrBaseUrl(`https://${productionUrl.replace(/^https?:\/\//, '')}`));

    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) urls.push(normalizeRemoteOmrBaseUrl(`https://${vercelUrl.replace(/^https?:\/\//, '')}`));

    return [...new Set(urls)];
}

function remoteErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'string') return error;
    if (typeof error === 'number' || typeof error === 'boolean') return String(error);
    if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') return error.message;
        if ('code' in error && typeof error.code === 'string') return error.code;

        try {
            return JSON.stringify(error);
        } catch {
            return fallback;
        }
    }

    return fallback;
}

function describeOmrEndpoint(baseUrl: string, endpoint: string): string {
    try {
        const url = new URL(endpoint, baseUrl);
        return `${url.origin}${url.pathname}`;
    } catch {
        return endpoint;
    }
}

function assertSafeRemotePath(relativePath: string): string {
    if (!relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes('..')) {
        throw new Error(`OMR service returned an unsafe file path: ${relativePath}`);
    }
    return relativePath;
}

async function postRemoteOmr<T>(endpoint: string, payload: unknown): Promise<T> {
    const baseUrls = getRemoteOmrBaseUrls();
    if (baseUrls.length === 0) {
        throw new Error('OMR_SERVICE_URL is not configured');
    }

    const headers: Record<string, string> = {
        'content-type': 'application/json',
    };
    if (process.env.OMR_SERVICE_TOKEN) {
        headers[OMR_SERVICE_TOKEN_HEADER] = process.env.OMR_SERVICE_TOKEN;
    }

    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
        const target = `${baseUrl}${endpoint}`;
        try {
            const response = await fetch(target, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            let data: unknown;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(`OMR service returned non-JSON response (${response.status}) from ${describeOmrEndpoint(baseUrl, endpoint)}: ${text.slice(0, 300)}`);
            }

            if (!response.ok) {
                const error = typeof data === 'object' && data && 'error' in data
                    ? remoteErrorMessage(data.error, response.statusText)
                    : response.statusText;
                throw new Error(`OMR service failed at ${describeOmrEndpoint(baseUrl, endpoint)}: ${error}`);
            }

            return data as T;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('OMR service request failed');
        }
    }

    throw lastError ?? new Error('OMR service request failed');
}

async function collectFiles(rootDir: string): Promise<RemoteFile[]> {
    const files: RemoteFile[] = [];

    async function visit(dir: string) {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await visit(fullPath);
                continue;
            }

            if (!entry.isFile() || entry.name.endsWith('.pdf')) continue;

            files.push({
                path: path.relative(rootDir, fullPath),
                content_b64: (await readFile(fullPath)).toString('base64'),
            });
        }
    }

    await visit(rootDir);
    return files;
}

async function writeRemoteFiles(rootDir: string, files: RemoteFile[]): Promise<string[]> {
    const written: string[] = [];

    for (const file of files) {
        const relativePath = assertSafeRemotePath(file.path);
        const target = path.join(rootDir, relativePath);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, Buffer.from(file.content_b64, 'base64'));
        written.push(target);
    }

    return written;
}

function argValue(args: string[], flag: string): string {
    const index = args.indexOf(flag);
    if (index === -1 || !args[index + 1]) {
        throw new Error(`Missing ${flag} argument for OMR command`);
    }
    return args[index + 1];
}

async function runRemoteOmrPython<T>(args: string[]): Promise<T> {
    const moduleName = args[1];

    if (moduleName === 'omr.generate') {
        const specPath = argValue(args, '--spec');
        const outDir = argValue(args, '--out');
        const spec = JSON.parse(await readFile(specPath, 'utf8')) as OmrSpec;
        const result = await postRemoteOmr<RemoteGenerateResponse>('/api/omr-generate', { spec });

        if (!result.ok || !result.summary || !result.files) {
            throw new Error(result.error || 'OMR remote sheet generation failed');
        }

        await writeRemoteFiles(outDir, result.files);
        const pdfFile = result.files.find((file) => file.path.toLowerCase().endsWith('.pdf'));
        const artifacts = result.files
            .filter((file) => !file.path.toLowerCase().endsWith('.pdf'))
            .map((file) => path.join(outDir, assertSafeRemotePath(file.path)));

        return {
            ...result.summary,
            pdf: pdfFile ? path.join(outDir, assertSafeRemotePath(pdfFile.path)) : result.summary.pdf,
            artifacts,
        } as T;
    }

    if (moduleName === 'omr.detect') {
        const imagePath = argValue(args, '--image');
        const layoutDir = argValue(args, '--layout');
        const page = args.includes('--page') ? Number(argValue(args, '--page')) : undefined;
        const includeImages = args.includes('--images');
        const imageStats = await stat(imagePath);
        const result = await postRemoteOmr<T>('/api/omr-detect', {
            filename: path.basename(imagePath),
            image_b64: (await readFile(imagePath)).toString('base64'),
            image_size: imageStats.size,
            include_images: includeImages,
            page,
            layout_files: await collectFiles(layoutDir),
        });

        return result;
    }

    throw new Error(`Unsupported remote OMR command: ${moduleName}`);
}

async function runOmrPython<T>(args: string[], timeout = 60_000): Promise<T> {
    if (getRemoteOmrBaseUrls().length > 0) {
        return runRemoteOmrPython<T>(args);
    }

    const pythonBin = process.env.OMR_PYTHON_BIN || (existsSync(LOCAL_OMR_PYTHON) ? LOCAL_OMR_PYTHON : 'python3');

    try {
        const { stdout } = await execFileAsync(pythonBin, args, {
            cwd: OMR_ROOT,
            env: {
                ...process.env,
                PYTHONPATH: OMR_ROOT,
            },
            timeout,
            maxBuffer: 20 * 1024 * 1024,
        });

        return parsePythonJson<T>(stdout);
    } catch (error) {
        const err = error as NodeJS.ErrnoException & { stderr?: string; stdout?: string };
        const detail = err.stderr || err.stdout || err.message;
        throw new Error(`OMR Python command failed: ${detail}`);
    }
}

export async function generateOmrSheet(testId: string): Promise<GenerateOmrSheetResult> {
    const test = await getOwnedTestForOmr(testId);
    if (!test) {
        throw new Error('Test not found');
    }

    const spec = toOmrSpec(test);
    const layoutDir = path.join(OMR_WORK_ROOT, test.id, `v${spec.version}`);
    await mkdir(layoutDir, { recursive: true });

    const specPath = path.join(layoutDir, 'spec.json');
    await writeFile(specPath, JSON.stringify(spec, null, 2), 'utf8');

    const summary = await runOmrPython<PythonGenerateSummary>([
        '-m',
        'omr.generate',
        '--spec',
        specPath,
        '--out',
        layoutDir,
    ]);

    if (!summary.ok) {
        throw new Error(summary.error || 'OMR sheet generation failed');
    }

    return {
        test,
        spec,
        layoutDir,
        pdfPath: summary.pdf,
        summary,
    };
}

/**
 * Generate the same production OMR PDF used by saved tests, but from an
 * in-progress Create Test form. Preview artifacts are isolated in a temporary
 * directory and removed as soon as the PDF has been read.
 */
export async function readGeneratedOmrDraftPdf(
    input: OmrDraftInput,
): Promise<{ pdf: Buffer; summary: PythonGenerateSummary }> {
    const ctx = await getAuthContext();
    if (!ctx) throw new Error('Unauthorized');

    const spec = toDraftOmrSpec(input);
    await mkdir(OMR_WORK_ROOT, { recursive: true });
    const layoutDir = await mkdtemp(path.join(OMR_WORK_ROOT, 'preview-'));

    try {
        const specPath = path.join(layoutDir, 'spec.json');
        await writeFile(specPath, JSON.stringify(spec, null, 2), 'utf8');

        const summary = await runOmrPython<PythonGenerateSummary>([
            '-m',
            'omr.generate',
            '--spec',
            specPath,
            '--out',
            layoutDir,
        ]);

        if (!summary.ok) {
            throw new Error(summary.error || 'OMR preview generation failed');
        }

        return { pdf: await readFile(summary.pdf), summary };
    } finally {
        await rm(layoutDir, { recursive: true, force: true }).catch(() => undefined);
    }
}

export async function readGeneratedOmrPdf(testId: string): Promise<GenerateOmrSheetResult & { pdf: Buffer }> {
    const generated = await generateOmrSheet(testId);
    const pdf = await readFile(generated.pdfPath);
    return { ...generated, pdf };
}

export async function detectOmrScan(
    testId: string,
    image: Buffer,
    filename = 'scan.png',
    includeImages = false,
): Promise<{ generated: GenerateOmrSheetResult; detection: OmrDetectionResult }> {
    const generated = await generateOmrSheet(testId);
    const detection = await detectOmrScanWithGenerated(generated, image, filename, includeImages);

    return { generated, detection };
}

async function detectOmrScanWithGenerated(
    generated: GenerateOmrSheetResult,
    image: Buffer,
    filename = 'scan.png',
    includeImages = false,
): Promise<OmrDetectionResult> {
    const safeFilename = filename.replace(/[^A-Za-z0-9._-]/g, '_') || 'scan.png';
    const imagePath = path.join(generated.layoutDir, `${Date.now()}-${safeFilename}`);

    await writeFile(imagePath, image);
    try {
        const args = ['-m', 'omr.detect', '--image', imagePath, '--layout', generated.layoutDir];
        if (includeImages) args.push('--images');

        const detection = await runOmrPython<OmrDetectionResult>(args);
        return detection;
    } finally {
        await unlink(imagePath).catch(() => undefined);
    }
}

export async function detectOmrScans(
    testId: string,
    scans: OmrScanInput[],
    includeImages = false,
): Promise<{
    generated: GenerateOmrSheetResult;
    detections: Array<OmrDetectionResult & { filename: string }>;
    combinedDetection: OmrDetectionResult;
}> {
    if (scans.length === 0) {
        throw new Error('At least one OMR scan is required');
    }

    const generated = await generateOmrSheet(testId);
    const detections = [];

    for (const scan of scans) {
        const filename = scan.filename || 'scan.png';
        const detection = await detectOmrScanWithGenerated(generated, scan.image, filename, includeImages);
        detections.push({ ...detection, filename });
    }

    const warnings = detections.flatMap((detection) =>
        detection.warnings.map((warning) => `${detection.filename}: ${warning}`),
    );
    const responses = detections
        .flatMap((detection) => detection.responses)
        .sort((a, b) => a.question_no - b.question_no);
    const pages = [...new Set(detections.map((detection) => detection.page).filter((page): page is number => typeof page === 'number'))].sort(
        (a, b) => a - b,
    );

    const combinedDetection: OmrDetectionResult = {
        ok: detections.every((detection) => detection.ok),
        status: detections.every((detection) => detection.ok) ? 'read' : 'review_required',
        paper_id: detections.find((detection) => detection.paper_id)?.paper_id ?? generated.summary.paper_id,
        version: detections.find((detection) => detection.version)?.version ?? generated.summary.version,
        page: pages.length === 1 ? pages[0] : undefined,
        warnings,
        quality: {
            roll_number: detections.find((detection) => detection.quality.roll_number)?.quality.roll_number,
            blur_floor: detections.find((detection) => detection.quality.blur_floor)?.quality.blur_floor,
        },
        responses,
        fib_crops: detections.flatMap((detection) => detection.fib_crops ?? []),
        needs_review: detections.some((detection) => detection.needs_review || !detection.ok),
    };

    return {
        generated,
        detections,
        combinedDetection,
    };
}

export function gradeOmrDetection(test: NonNullable<OmrTest>, detection: OmrDetectionResult): OmrGradeSummary {
    const byQuestionNo = new Map(detection.responses.map((response) => [response.question_no, response]));

    const answers = test.questions.flatMap((testQuestion) => {
        const source = sourceForTestQuestion(testQuestion);
        const optionCount = source.options?.length ?? 0;
        const type = normalizeQuestionType(source.question_type, optionCount);

        if (type === 'FIB') return [];

        const detected = byQuestionNo.get(testQuestion.questionNumber);
        const selectedAnswer = normalizeDetectedAnswer(detected?.detected ?? '', optionCount);
        const correctAnswer = normalizeChoiceKey(source.answer, source.options ?? []);
        const sourceQuestionId = testQuestion.questionId ?? testQuestion.schoolTestQuestionId;

        if (!sourceQuestionId) return [];

        const isAmbiguous = Boolean(detected?.is_ambiguous);
        const isCorrect = Boolean(!isAmbiguous && selectedAnswer && correctAnswer && selectedAnswer === correctAnswer);
        const earnedMarks = isCorrect ? testQuestion.marks : 0;
        const status: OmrAnswerGradeStatus = isAmbiguous
            ? 'review'
            : !selectedAnswer
                ? 'unanswered'
                : !correctAnswer
                    ? 'no_key'
                    : isCorrect
                        ? 'correct'
                        : 'incorrect';

        return {
            questionNumber: testQuestion.questionNumber,
            questionId: sourceQuestionId,
            questionText: source.question_text,
            selectedAnswer,
            correctAnswer,
            confidence: detected?.confidence ?? 0,
            marks: testQuestion.marks,
            earnedMarks,
            isCorrect,
            isAmbiguous,
            status,
        };
    });

    const score = answers.reduce((total, answer) => total + answer.earnedMarks, 0);
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const percentage = test.totalMarks > 0 ? (score / test.totalMarks) * 100 : 0;

    return {
        score,
        totalMarks: test.totalMarks,
        percentage,
        correctAnswers,
        totalQuestions: answers.length,
        answers,
    };
}

export async function saveDetectedOmrResponse(
    test: NonNullable<OmrTest>,
    detection: OmrDetectionResult,
    studentInput: SaveDetectedResponseArgs,
) {
    // The roster row must be scoped to the caller's organization, or roll "12"
    // in class "10A" is the same student at every school on the platform.
    const ctx = await requireAuth();

    if (!detection.ok) {
        throw new Error('Cannot save an unreadable OMR sheet');
    }

    if (detection.needs_review) {
        throw new Error('Cannot save an OMR sheet that needs manual review');
    }

    const rollNumber = studentInput.rollNumber || detection.quality.roll_number;
    if (!rollNumber) {
        throw new Error('Roll number is required');
    }

    const grading = gradeOmrDetection(test, detection);
    const answers = grading.answers.map((answer) => ({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
    }));

    // Identity is (org, class, roll) — NOT the name. Matching on the name forked
    // a new roster row every time OCR or the teacher spelled it differently.
    // See lib/examination/studentRoster.ts.
    const student = await resolveOrCreateStudent({
        organizationId: ctx.organizationId,
        name: studentInput.name,
        className: studentInput.className,
        rollNumber,
        // When the test is linked to a class, identity resolves through that
        // class's Enrollment rather than the denormalised className string —
        // which is what survives a student being promoted.
        classId: test.classId,
    });

    const existing = await prisma.studentResponse.findUnique({
        where: {
            testId_studentId: {
                testId: test.id,
                studentId: student.id,
            },
        },
        select: { id: true },
    });

    if (existing) {
        await prisma.testAnswer.deleteMany({
            where: { studentResponseId: existing.id },
        });

        return prisma.studentResponse.update({
            where: { id: existing.id },
            data: {
                score: grading.score,
                totalMarks: test.totalMarks,
                percentage: grading.percentage,
                timeTaken: studentInput.timeTaken,
                answers: {
                    create: answers,
                },
            },
            include: { student: true, answers: true },
        });
    }

    return prisma.studentResponse.create({
        data: {
            testId: test.id,
            studentId: student.id,
            score: grading.score,
            totalMarks: test.totalMarks,
            percentage: grading.percentage,
            timeTaken: studentInput.timeTaken,
            answers: {
                create: answers,
            },
        },
        include: { student: true, answers: true },
    });
}
