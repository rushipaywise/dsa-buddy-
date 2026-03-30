import { NextResponse } from "next/server";

const STITCH_ENDPOINT = "https://stitch.googleapis.com/mcp";

export async function GET() {
  const apiKey = process.env.MCP_STITCH_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "MCP_STITCH_API_KEY not set" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(STITCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: "health-check",
      }),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Health check failed",
        message: error?.message || "Unknown health check failure",
      },
      { status: 500 },
    );
  }
}
