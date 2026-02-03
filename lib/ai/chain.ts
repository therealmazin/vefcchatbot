import { createGroq } from "@ai-sdk/groq";
import { generateText, streamText } from "ai";
import { Document } from "@langchain/core/documents";
import { queryVectorStore } from "../kb/vectorstore";
import { VOCATIONAL_SYSTEM_PROMPT, RAG_PROMPT_TEMPLATE } from "./prompts";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use Llama 3.3 70B model
const model = groq("llama-3.3-70b-versatile");

// Format documents for context
function formatDocuments(docs: Document[]): string {
  return docs
    .map((doc) => {
      const source = doc.metadata.fileName || doc.metadata.source || "Unknown";
      return `[Source: ${source}]\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");
}

// Build the full prompt with context
function buildPrompt(question: string, context: string): string {
  const ragPrompt = RAG_PROMPT_TEMPLATE.replace("{context}", context).replace(
    "{question}",
    question
  );
  return ragPrompt;
}

/**
 * Query the RAG chain with automatic KB lookup
 */
export async function queryRAGChain(
  question: string,
  k: number = 5
): Promise<{ answer: string; sources: Document[] }> {
  // Retrieve relevant documents
  const relevantDocs = await queryVectorStore(question, k);

  // Format context from retrieved documents
  const context = formatDocuments(relevantDocs);

  // Build the full prompt
  const prompt = buildPrompt(question, context);

  // Generate response
  const { text } = await generateText({
    model,
    system: VOCATIONAL_SYSTEM_PROMPT,
    prompt,
  });

  return {
    answer: text,
    sources: relevantDocs,
  };
}

/**
 * Stream RAG chain response
 */
export async function streamRAGChain(
  question: string,
  k: number = 5
): Promise<{ stream: ReturnType<typeof streamText>; sources: Document[] }> {
  // Retrieve relevant documents
  const relevantDocs = await queryVectorStore(question, k);

  // Format context from retrieved documents
  const context = formatDocuments(relevantDocs);

  // Build the full prompt
  const prompt = buildPrompt(question, context);

  // Create streaming response
  const stream = streamText({
    model,
    system: VOCATIONAL_SYSTEM_PROMPT,
    prompt,
  });

  return {
    stream,
    sources: relevantDocs,
  };
}

export { formatDocuments, model };
