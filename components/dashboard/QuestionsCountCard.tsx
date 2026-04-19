import { getQuestionsData } from "@/actions/dashboard/questionsData";

export async function QuestionsCountCard() {
    const { totalQuestions } = await getQuestionsData();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-700">Total Questions</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalQuestions}</p>
        </div>
    );
}
