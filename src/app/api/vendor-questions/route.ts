import { NextRequest, NextResponse } from "next/server";
import { VendorQuestionRequestSchema } from "@/lib/ai-schemas";
import { generateVendorQuestionsWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON payload in request body.",
        },
        { status: 400 }
      );
    }

    const parseResult = VendorQuestionRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on vendor question request.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { result, source } = await generateVendorQuestionsWithGemini(parseResult.data);

    return NextResponse.json({
      success: true,
      result,
      source,
    });
  } catch (err: unknown) {
    console.error("API /api/vendor-questions error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal server error occurred while preparing vendor questions.",
      },
      { status: 500 }
    );
  }
}

