import { NextRequest, NextResponse } from "next/server";
import { BudgetTradeoffRequestSchema } from "@/lib/ai-schemas";
import { generateAIBudgetTradeoffs } from "@/lib/gemini";

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
    console.error("API /api/budget-tradeoffs error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal server error occurred while generating budget trade-offs.",
      },
      { status: 500 }
    );
  }
}
