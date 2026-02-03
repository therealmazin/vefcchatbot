import { NextRequest, NextResponse } from "next/server";
import { queryRAGChain, streamRAGChain } from "@/lib/ai/chain";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, stream: shouldStream = true } = await req.json();

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    const userQuestion = lastMessage.content;

    if (shouldStream) {
      // Streaming response
      const { stream, sources } = await streamRAGChain(userQuestion, 5);

      // Create a ReadableStream for streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Stream the text
            for await (const chunk of stream.textStream) {
              const data = JSON.stringify({ content: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Send sources at the end
            const sourcesData = JSON.stringify({
              done: true,
              sources: sources.map((doc) => ({
                fileName: doc.metadata.fileName || doc.metadata.source,
                content: doc.pageContent.substring(0, 200) + "...",
              })),
            });
            controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            const errorData = JSON.stringify({
              error: "Stream error",
              details: String(error),
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming response
      const { answer, sources } = await queryRAGChain(userQuestion, 5);

      return NextResponse.json({
        content: answer,
        sources: sources.map((doc) => ({
          fileName: doc.metadata.fileName || doc.metadata.source,
          content: doc.pageContent.substring(0, 200) + "...",
        })),
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}
