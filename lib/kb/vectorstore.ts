import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs";
import path from "path";

// Simple in-memory vector store using cosine similarity
interface VectorEntry {
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

// Path to cached vector store
const CACHE_PATH = path.join(process.cwd(), ".vectorstore-cache.json");

// Text splitter configuration
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Simple vector store class
class SimpleVectorStore {
  private entries: VectorEntry[] = [];

  async addDocuments(docs: Document[], embeddings: number[][]): Promise<void> {
    for (let i = 0; i < docs.length; i++) {
      this.entries.push({
        content: docs[i].pageContent,
        embedding: embeddings[i],
        metadata: docs[i].metadata,
      });
    }
  }

  async similaritySearch(queryEmbedding: number[], k: number = 5): Promise<Document[]> {
    // Calculate cosine similarity for all entries
    const scored = this.entries.map((entry) => ({
      entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    // Sort by similarity (descending)
    scored.sort((a, b) => b.score - a.score);

    // Return top k results
    return scored.slice(0, k).map((item) =>
      new Document({
        pageContent: item.entry.content,
        metadata: item.entry.metadata,
      })
    );
  }

  getEntries(): VectorEntry[] {
    return this.entries;
  }

  loadEntries(entries: VectorEntry[]): void {
    this.entries = entries;
  }
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Singleton vector store instance
let vectorStoreInstance: SimpleVectorStore | null = null;

// Embedding model instance (lazy loaded)
let embeddingPipeline: unknown = null;

/**
 * Get the embedding pipeline (lazy loaded)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log("Loading embedding model (first time may take a moment)...");
    const { pipeline } = await import("@xenova/transformers");
    embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for texts
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const embeddings: number[][] = [];

  for (const text of texts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await (pipe as any)(text, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(output.data));
  }

  return embeddings;
}

/**
 * Create and populate vector store from documents
 */
export async function createVectorStore(docs: Document[]): Promise<SimpleVectorStore> {
  console.log("Splitting documents into chunks...");
  const splitDocs = await textSplitter.splitDocuments(docs);
  console.log(`Created ${splitDocs.length} chunks from ${docs.length} documents`);

  console.log("Generating embeddings (this may take a few minutes on first run)...");
  const texts = splitDocs.map((doc) => doc.pageContent);
  const embeddings = await generateEmbeddings(texts);

  console.log("Creating vector store...");
  const store = new SimpleVectorStore();
  await store.addDocuments(splitDocs, embeddings);

  // Cache the vector store
  try {
    const cacheData = {
      entries: store.getEntries(),
      timestamp: Date.now(),
    };
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheData));
    console.log("Vector store cache saved.");
  } catch (error) {
    console.warn("Could not save vector store cache:", error);
  }

  vectorStoreInstance = store;
  return store;
}

/**
 * Load vector store from cache
 */
function loadFromCache(): SimpleVectorStore | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) {
      return null;
    }

    const cacheData = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    const store = new SimpleVectorStore();
    store.loadEntries(cacheData.entries);

    console.log(`Loaded ${cacheData.entries.length} cached entries.`);
    return store;
  } catch (error) {
    console.warn("Could not load from cache:", error);
    return null;
  }
}

/**
 * Get existing vector store instance
 */
export async function getVectorStore(): Promise<SimpleVectorStore> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  // Try to load from cache
  const cached = loadFromCache();
  if (cached) {
    vectorStoreInstance = cached;
    return cached;
  }

  throw new Error(
    "Vector store not initialized. Please run 'pnpm seed-kb' first to index the knowledge base."
  );
}

/**
 * Query the vector store for relevant documents
 */
export async function queryVectorStore(query: string, k: number = 5): Promise<Document[]> {
  const store = await getVectorStore();
  const [queryEmbedding] = await generateEmbeddings([query]);
  return store.similaritySearch(queryEmbedding, k);
}

export { textSplitter, generateEmbeddings, SimpleVectorStore };
