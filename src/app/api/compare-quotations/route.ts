import { NextRequest, NextResponse } from "next/server";
import { QuotationComparisonRequestSchema } from "@/lib/ai-schemas";
import { compareQuotationsWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const parseResult = QuotationComparisonRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on quotation comparison request.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { result, source } = await compareQuotationsWithGemini(parseResult.data);

    return NextResponse.json({
      success: true,
      result,
      source,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API /api/compare-quotations error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while comparing vendor quotations.",
        message,
      },
      { status: 500 }
    );
  }
}

