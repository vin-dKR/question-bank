export { }
import WebSocket from 'ws';

declare global {
    interface Window {
        // eslint-disable-next-line
        MathJax: any;
    }

    interface CustomJwtSessionClaims {
        metadata: {
            onboardingComplete?: boolean
        }
    }

    interface PDFGenerationOptions {
        includeAnswers: boolean;
        watermarkOpacity: number;
        logo?: File | null;
    }

    interface Question {
        id: string;
        question_number: number;
        file_name?: string | null;
        question_text: string;
        isQuestionImage?: boolean;
        question_image?: string | null;
        isOptionImage?: boolean;
        options: string[];
        option_images?: string[] | null;
        section_name?: string | null;
        question_type?: string | null;
        topic?: string | null;
        exam_name?: string | null
        subject?: string | null;
        chapter?: string | null;
        answer: string;
        folderId?: string | null;
        folder?: FetchDraft | null;
        flagged?: boolean
    }

    // Draft ------------------------------------------------------------------
    interface QuestionDraft {
        id: string;
        name: string;
        questions: Question[];
        createdAt: Date;
        updatedAt: Date;
    }

    interface DraftManagerProps {
        selectedQuestions: Question[];
        onDraftSelect: (questions: Question[]) => void;
        onDraftUpdate?: (draft: QuestionDraft) => void;
        initialDrafts?: QuestionDraft[];
    }

    interface FetchDraft {
        id: string;
        name: string;
        questions: Question[];
    }

    interface DraftManagerPropsLimit {
        previewLimit?: number;
    }

    interface LocalFetchDraft {
        id: string;
        name: string;
        // eslint-disable-next-line
        questions: any[];
        userRole: 'owner' | 'editor' | 'viewer';
        isCollaborated: boolean;
        collaboratorCount: number;
    }

    interface PDFGeneratorProps {
        selectedQuestions: Question[];
        options: PDFGenerationOptions;
    }

    interface LogoUploaderProps {
        onUpload: (logo: File | null) => void;
    }

    interface QuestionSelectorProps {
        onSelect: (selected: Question[]) => void;
    }

    interface PDFConfig {
        institution: string
        institutionAddress?: string
        selectedQuestions: Question[];
        options: PDFGenerationOptions;
        className?: string;
        marks?: string;
        time?: string;
        exam?: string;
        subject?: string;
        logo?: string;
        session?: string;
        standard?: string;
        watermarkOpacity?: number;
    }


    interface PDFGeneratorContextType {
        options: PDFGenerationOptions;
        setOptions: React.Dispatch<React.SetStateAction<PDFGenerationOptions>>;
        setLogo: (logo: File | null) => void;
        institution: string;
        setInstitution: (institution: string) => void;
        image: File | null;
        setImage: (image: File | null) => void;
        customSettings: {
            fontSize?: number;
            pageLayout?: 'portrait' | 'landscape';
            [key: string]: any;
        };
        setCustomSettings: React.Dispatch<
            React.SetStateAction<{
                fontSize?: number;
                pageLayout?: 'portrait' | 'landscape';
                [key: string]: any;
            }>
        >;
    }

    interface Institution {
        name: string;
        logo?: string;
    }

    interface PDFGenerationOptions {
        includeAnswers?: boolean;
        includeMetadata?: boolean;
        institution?: string;
        logo?: File | Blob;
        watermarkOpacity?: number;
        pageSize?: 'a4' | 'letter' | 'legal';
        orientation?: 'portrait' | 'landscape';
        fontSize?: number;
        lineHeight?: number;
        margin?: number;
        pdfOptions?: HTMLToPDFOptions;
    }

    interface QuestionToHTMLOptions {
        includeAnswers?: boolean;
        includeMetadata?: boolean;
        pageSize?: 'a4' | 'letter' | 'legal';
        orientation?: 'portrait' | 'landscape';
        fontSize?: number;
        lineHeight?: number;
        margin?: number;
    }

    interface HTMLToPDFOptions {
        filename?: string;
        pageSize?: 'a4' | 'letter' | 'legal';
        orientation?: 'portrait' | 'landscape';
        margin?: number;
        scale?: number;
        quality?: number;
        returnBlob?: boolean;
    }
    interface PDFGenerationOptions {
        includeAnswers?: boolean;
        includeMetadata?: boolean;
        institution?: string;
        logo?: File | Blob;
        watermarkOpacity?: number;
        pageSize?: 'a4' | 'letter' | 'legal';
        orientation?: 'portrait' | 'landscape';
        fontSize?: number;
        lineHeight?: number;
        margin?: number;
        pdfOptions?: HTMLToPDFOptions;
    }

    interface Filters {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        section_name?: string;
        flagged?: boolean;
    }

    interface Pagination {
        page: number;
        limit: number;
    }

    interface FilterOptions {
        exams: string[];
        subjects: string[];
        chapters: string[];
        section_names: string[];
    }

    interface TeacherOnboardingData {
        name: string;
        email: string;
        school: string;
        subject: string;
        experience: string | undefined;
        studentCount?: string;
    }

    interface StudentOnboardingData {
        name: string;
        email: string;
        grade: string;
        targetExam: string;
        subjects: string[];
    }

    interface CoachingOnboardingData {
        centerName: string;
        contactPerson: string;
        email: string;
        phone: string;
        location: string;
        teacherCount: string | undefined;
        studentCount: string | undefined;
        targetExams: string[];
    }

    type OnboardingData =
        | TeacherOnboardingData
        | StudentOnboardingData
        | CoachingOnboardingData;

    type UserRole = "teacher" | "student" | "coaching";

    interface OnboardingStore {
        onboarding: { role: UserRole; data: OnboardingData } | null;
        setRole: (role: UserRole) => void;
        setData: (data: Partial<OnboardingData>) => void;
        clearOnboarding: () => void;
    }

    interface FormFieldProps {
        id: string;
        label: string;
        type: string;
        name?: string;
        value?: string;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        accept?: string;
        required?: boolean;
    }

    interface TemplateFormData {
        templateName: string;
        institution?: string;
        institutionAddress?: string;
        marks?: string
        time?: string
        exam?: string
        subject?: string
        logo?: string
        saveTemplate?: boolean
        standard?: string
        session?: string
    }

    interface Template extends TemplateFormData {
        id: string;
        createdAt: Date
        updatedAt: Date
    }

    interface PDFDetailsFormProps {
        initialData: TemplateFormData;
        onSubmit: (data: TemplateFormData) => void;
        onCancel: () => void;
        isGenerating?: boolean;
    }

    // Sidebar ----------------------------------------------------------------

    interface SidebarItem {
        name: string;
        description: string;
        href: string;
        icon: React.ReactElement;
    }

    interface SidebarGroup {
        name: string;
        description: string;
        icon: React.ReactElement;
        items: SidebarItem[];
    }
    // Onboarding/FormComponents ----------------------------------------------
    interface FormInputProps {
        id: string;
        name: string;
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
        label: string;
        type?: string;
        isRequired?: boolean;
    }

    interface FormSelectProps {
        id: string;
        name: string;
        value: string | undefined;
        onChange: (value: string) => void;
        placeholder: string;
        label: string;
        options: { value: string; label: string }[];
        isRequired?: boolean;
    }

    interface FormCheckboxGroupProps {
        name: string;
        label: string;
        options: { id: string; label: string }[];
        values: string[];
        onChange: (id: string, checked: boolean) => void;
        isRequired?: boolean;
    }

    interface SubmitButtonProps {
        loading: boolean;
    }

    interface OnboardingLayoutProps {
        title: string;
        description: string;
        children: React.ReactNode;
    }


    // question-update --------------------------------------------------------
    interface UpdateQuestionResponse {
        success: boolean;
        data?: {
            id: string;
            question_text: string;
            options: string[];
        };
        error?: string;
    }


    //tex-render --------------------------------------------------------------
    interface TextPart {
        type: 'text';
        value: string;
    }

    interface LatexPart {
        type: 'latex';
        value: string;
    }

    // ai-refine --------------------------------------------------------------
    interface RefineTextResponse {
        success: boolean;
        refined_text?: string;
        error?: string;
    }

    // collaboration ----------------------------------------------------------
    interface CollaborationUser {
        userId: string;
        userName: string;
        isOnline: boolean;
    }

    interface CollaborationMessageData {
        action: "joined" | "left" | "room_state" | "reorder";
        users?: CollaborationUser[];
        questionCount?: number;
    }

    interface CollaborationMessage {
        type: 'join' | 'leave' | 'update' | 'presence' | 'cursor';
        folderId: string;
        userId: string;
        userName: string;
        data?: CollaborationMessageData
    }

    interface CollaborationContextType {
        connectedUsers: CollaborationUser[];
        isConnected: boolean;
        sendMessage: (message: CollaborationMessage) => void;
        joinFolder: (folderId: string) => void;
        leaveFolder: () => void;
        currentFolderId: string | null;
    }

    interface ConnectedUser {
        ws: WebSocket;
        userId: string;
        userName: string;
        folderId: string;
    }


    // email service ----------------------------------------------------------
    interface EmailOptions {
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }


    // Examination / Tests ----------------------------------------------------

    interface QuestionForTestQuestion {
        id: string;
        question_text: string;
        options: string[];
        answer: string | null; // Matches Prisma schema's String?
        question_number: number;
        isQuestionImage: boolean;
        isOptionImage: boolean;
        option_images: string[];
    }

    interface TestQuestion {
        id: string;
        testId: string;
        questionId: string;
        marks: number;
        questionNumber: number;
        createdAt: Date;
        updatedAt: Date;
        question: QuestionForTestQuestion;
    }

    interface Student {
        id: string;
        name: string;
        rollNumber: string;
        className: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
    }

    interface StudentResponse {
        id: string;
        testId: string;
        studentId: string;
        answers: { questionId: string; selectedAnswer: string }[]; // Matches Prisma Json
        score: number;
        totalMarks: number;
        percentage: number;
        submittedAt: Date;
        timeTaken: number | null; // Matches Prisma Int?
        createdAt: Date;
        updatedAt: Date;
        correctAnswers?: number;
        student: Student;
    }

    interface Test {
        id: string;
        title: string;
        description: string | null; // Matches Prisma String?
        subject: string;
        duration: number;
        totalMarks: number;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
        questions: TestQuestion[];
        responses: StudentResponse[];
        _count: {
            responses: number;
        };
    }

    interface CreateTestData {
        title: string;
        description?: string; // Optional to match Prisma
        subject: string;
        duration: number;
        totalMarks: number;
        questions: {
            questionText: string;
            options: string[];
            answer: string; // Input as string to match comparison logic
            marks: number;
            questionNumber: number;
        }[];
    }

    interface ExaminationTest {
        id: string;
        title: string;
        description: string | null | undefined; // Matches global types.d.ts
        subject: string;
        duration: number;
        totalMarks: number;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
        questions: {
            id: string;
            questionText: string;
            options: string[];
            answer: string; // Output as string, default to empty string
            marks: number;
            questionNumber: number;
        }[];
        responses?: StudentResponse[];
        _count?: {
            responses: number;
        };
    }

    interface QuestionAnalytics {
        questionId: string;
        questionNumber: number; // Matches global types.d.ts
        questionText: string;
        correctAnswers: number;
        totalAttempts: number;
        accuracy: number;
    }

    interface StudentAnalytics {
        studentId: string;
        studentName: string;
        rollNumber: string;
        className: string;
        score: number;
        percentage: number;
        correctAnswers: number;
        totalQuestions: number;
        timeTaken: number | null; // Matches Prisma Int?
    }

    interface TestAnalytics {
        testId: string;
        totalStudents: number;
        averageScore: number;
        highestScore: number;
        lowestScore: number;
        averagePercentage: number;
        questionAnalytics: QuestionAnalytics[];
        studentAnalytics: StudentAnalytics[];
    }
}
