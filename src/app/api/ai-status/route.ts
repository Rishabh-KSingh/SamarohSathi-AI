import { NextResponse } from "next/server";
import { checkGeminiHealth } from "@/lib/gemini";

export async function GET() {
  try {
    const health = await checkGeminiHealth();
    return NextResponse.json(health);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Health check failure";
    return NextResponse.json(
      {
        status: "error",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        message: `AI diagnostic check failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
