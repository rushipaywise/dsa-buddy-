import { NextResponse } from "next/server";

const STITCH_ENDPOINT = "https://stitch.googleapis.com/mcp";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.MCP_STITCH_API_KEY || "";
    const body = await request.json();

    const response = await fetch(STITCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return new NextResponse(text, {
        status: response.status,
        headers: { "Content-Type": response.headers.get("content-type") || "text/plain" },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Proxy error",
        message: error?.message || "Unknown proxy failure",
      },
      { status: 500 },
    );
  }
}
