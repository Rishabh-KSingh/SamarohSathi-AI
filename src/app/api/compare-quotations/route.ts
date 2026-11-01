import { NextRequest, NextResponse } from "next/server";
import { QuotationComparisonRequestSchema } from "@/lib/ai-schemas";
import { compareQuotationsWithGemini } from "@/lib/gemini";

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
    console.error("API /api/compare-quotations error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal server error occurred while comparing vendor quotations.",
      },
      { status: 500 }
    );
  }
}

