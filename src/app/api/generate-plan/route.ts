import { NextRequest, NextResponse } from "next/server";
import { PlanGenerationInputSchema } from "@/lib/ai-schemas";
import { generateAIEventPlan } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API /api/generate-plan error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while generating celebration plan.",
        message,
      },
      { status: 500 }
    );
  }
}
