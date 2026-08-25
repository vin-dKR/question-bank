import DraftQuestion from "@/components/dashboard/drafts/DraftQuestionsPage";
import PaperHistory from "@/components/dashboard/history/PaperHistoryPage";
import QuesitonsPage from "@/components/dashboard/questions/QuestionsPage";
import QuestionTemplate from "@/components/dashboard/templates/QuestionTemplatePage";
import ExaminationPage from "../examination/page";
import { notFound } from "next/navigation";

export default async function SlugPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {

    const { slug } = await params

    switch (slug) {
        case "questions":
            return <QuesitonsPage />;
        case "history":
            return <PaperHistory />;
        case "drafts":
            return <DraftQuestion />;
        case "templates":
            return <QuestionTemplate />;
        case "examination":
            return <ExaminationPage />;
        default:
            // Previously fell through to the questions page, so a typo like
            // /quesitons rendered a working screen instead of an error — which
            // hides broken links from us and confuses the person who typed it.
            return notFound();
    }
}

