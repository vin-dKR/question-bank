import Script from "next/script";
import QuestionWorkspaceProviders from "@/components/providers/QuestionWorkspaceProviders";

export default function ExaminationLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <QuestionWorkspaceProviders>{children}</QuestionWorkspaceProviders>
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js"
                strategy="lazyOnload"
            />
        </>
    );
}
