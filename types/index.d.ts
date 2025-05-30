export { }

declare global {
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

    interface FetchDraft {
        id: string;
        name: string;
        questions: Question[];
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
        selectedQuestions: Question[];
        options: PDFGenerationOptions;
    }

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

}


