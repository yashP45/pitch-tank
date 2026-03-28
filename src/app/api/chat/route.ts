import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

interface ChatRequestBody {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt, stream: shouldStream = true } =
      (await request.json()) as ChatRequestBody;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (!shouldStream) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages as Anthropic.MessageParam[],
      });

      const text =
        response.content.find((b) => b.type === "text")?.text || "";
      return Response.json({ text });
    }

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on("text", (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
            );
          });

          await stream.finalMessage();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Stream failed";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
