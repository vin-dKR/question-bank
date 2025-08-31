import DraftQuestion from "@/components/dashboard/drafts/DraftQuestionsPage";
import PaperHistory from "@/components/dashboard/history/PaperHistoryPage";
import QuesitonsPage from "@/components/dashboard/questions/QuestionsPage";
import QuestionTemplate from "@/components/dashboard/templates/QuestionTemplatePage";
import ExaminationPage from "../examination/page";

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
            return <QuesitonsPage />;
    }
}

