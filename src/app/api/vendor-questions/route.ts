import { NextRequest, NextResponse } from "next/server";
import { VendorQuestionRequestSchema } from "@/lib/ai-schemas";
import { generateVendorQuestionsWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API /api/vendor-questions error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while preparing vendor questions.",
        message,
      },
      { status: 500 }
    );
  }
}

