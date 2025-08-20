import { pdfConfigToHTML } from "@/lib/questionToHtmlUtils"
import { sampleQuestions } from "@/constant/sample-questions"

export const preRenderHtml = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const config = {
                institution: "Sample Institution",
                selectedQuestions: sampleQuestions,
                options: {},
                marks: "100",
                time: "1 hour",
                exam: "Sample Exam",
                subject: "Sample Subject",
                logo: "",
            }

            const html = pdfConfigToHTML(config)

            if (!html || typeof html !== "string") {
                throw new Error("Failed to generate HTML");
            }

            resolve(html)
        } catch (error) {
            reject(new Error(`Pre-rendering failed: ${error instanceof Error ? error.message : "Unknown error"}`));
        }
    })

}
