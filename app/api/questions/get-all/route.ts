import { NextRequest, NextResponse } from "next/server";
import { getQuestions } from "@/actions/question/questionBank";
import { handleCorsResponse, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return handleOptionsRequest(request);
}

export async function GET(request: NextRequest) {
    try {
        const res = await getQuestions({})

        const response = NextResponse.json(
            {
                success: res.success,
                data: res.data,
                ...(res.error ? { error: res.error } : {}),
            }
        );
        
        return handleCorsResponse(request, response);
    } catch (error) {
        console.error("Error in /api/questions/get-all", error);
        const response = NextResponse.json(
            { success: false, error: "some errors", },
            { status: 500 }
        );
        
        return handleCorsResponse(request, response);
    }
}
