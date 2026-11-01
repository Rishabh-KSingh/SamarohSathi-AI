import { NextRequest, NextResponse } from "next/server";
import { BudgetTradeoffRequestSchema } from "@/lib/ai-schemas";
import { generateAIBudgetTradeoffs } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const parseResult = BudgetTradeoffRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on budget trade-off request.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const tradeoffResponse = await generateAIBudgetTradeoffs(parseResult.data);

    return NextResponse.json({
      success: true,
      tradeoffs: tradeoffResponse,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API /api/budget-tradeoffs error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while generating budget trade-offs.",
        message,
      },
      { status: 500 }
    );
  }
}
