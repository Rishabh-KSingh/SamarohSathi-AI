import { NextRequest, NextResponse } from "next/server";
import { PlanGenerationInputSchema } from "@/lib/ai-schemas";
import { generateAIEventPlan } from "@/lib/gemini";

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

    const parseResult = PlanGenerationInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on event input data.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { plan, source } = await generateAIEventPlan(parseResult.data);

    return NextResponse.json({
      success: true,
      plan,
      source,
    });
  } catch (err: unknown) {
    console.error("API /api/generate-plan error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal server error occurred while generating celebration plan.",
      },
      { status: 500 }
    );
  }
}
