import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    if (query.length > 2000) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You are a search query expander for construction/infrastructure project documents. Given a user's natural language question, output 10-15 related keywords and phrases that would match relevant contract sections, specifications, and project documents. Include synonyms, related legal/contractual terms, and technical equivalents. Output ONLY a JSON array of strings, nothing else.`,
      messages: [{ role: "user", content: query }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ expandedTerms: [] });
    }

    const expandedTerms: string[] = JSON.parse(match[0]);
    return NextResponse.json({ expandedTerms });
  } catch (err) {
    console.error("[search] query expansion failed:", err);
    return NextResponse.json({ expandedTerms: [] });
  }
}
