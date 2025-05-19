import { NextResponse } from "next/server";
import { getQuestions } from "@/actions/question/questionBank";

export async function GET() {
    try {
        const res = await getQuestions({})

        return NextResponse.json(
            {
                success: res.success,
                data: res.data,
                ...(res.error ? { error: res.error } : {}),
            }
        );
    } catch (error) {
        console.error("Error in /api/questions/get-all", error);
        return NextResponse.json(
            { success: false, error: "some errors", },
            { status: 500 }
        )
    }
}
