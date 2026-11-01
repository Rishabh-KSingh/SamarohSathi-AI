import { NextRequest, NextResponse } from "next/server";
import { PlanRevisionInputSchema } from "@/lib/ai-schemas";
import { proposePlanRevisionWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API /api/propose-revision error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while interpreting plan revision.",
        message,
      },
      { status: 500 }
    );
  }
}

