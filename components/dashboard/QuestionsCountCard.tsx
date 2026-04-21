import { getQuestionsData } from "@/actions/dashboard/questionsData";

export async function QuestionsCountCard() {
    const { totalQuestions } = await getQuestionsData();

    return (
        <div className="rounded-xl border border-black/5 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-medium text-zinc-500">Total Questions</h3>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{totalQuestions}</p>
        </div>
    );
}
