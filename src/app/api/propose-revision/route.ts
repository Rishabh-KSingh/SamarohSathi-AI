import { NextRequest, NextResponse } from "next/server";
import { PlanRevisionInputSchema } from "@/lib/ai-schemas";
import { proposePlanRevisionWithGemini } from "@/lib/gemini";

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

    const parseResult = PlanRevisionInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on plan revision input.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { proposal, source } = await proposePlanRevisionWithGemini(parseResult.data);

    return NextResponse.json({
      success: true,
      proposal,
      source,
    });
  } catch (err: unknown) {
    console.error("API /api/propose-revision error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal server error occurred while interpreting plan revision.",
      },
      { status: 500 }
    );
  }
}

