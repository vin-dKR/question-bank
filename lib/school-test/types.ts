export type Provider = "openai" | "gemini";

export type Detection = {
    q_no: number;
    has_image: boolean;
    bbox: [number, number, number, number] | null;
};

export type QuestionDraft = {
    id: string;
    question_number: number;
    question_text: string;
    options: string[];
};

export type Crop = {
    /** Stable id, used to pair a crop with a question card. */
    id: string;
    q_no: number;
    /** bbox at source-image resolution: [x, y, w, h] */
    bbox: [number, number, number, number];
    /** base64 data URL, image/png */
    dataUrl: string;
};

export type PageResult = {
    pageNumber: number;
    /** base64 data URL of the source page image (PNG) */
    sourceDataUrl: string;
    sourceWidth: number;
    sourceHeight: number;
    questions: QuestionDraft[];
    crops: Crop[];
};

export type ProcessEvent =
    | { type: "page-count"; total: number }
    | { type: "page-start"; page: number }
    | { type: "page-detected"; page: number; detectionCount: number }
    | { type: "page-extracted"; page: number; questionCount: number }
    | { type: "page-done"; page: number; result: PageResult }
    | { type: "complete" }
    | { type: "error"; message: string; page?: number };
