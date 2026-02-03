/**
 * Knowledge Base Seeding Script
 *
 * This script loads all KB documents and indexes them into the Chroma vector store.
 * Run this once before starting the chatbot, or whenever KB documents are updated.
 *
 * Usage: npx ts-node scripts/seed-kb.ts
 * Or: pnpm seed-kb
 */

import { loadKBDocuments } from "../lib/kb/loader";
import { createVectorStore } from "../lib/kb/vectorstore";

async function seedKnowledgeBase() {
  console.log("=".repeat(50));
  console.log("VEFC Knowledge Base Seeding Script");
  console.log("=".repeat(50));
  console.log();

  try {
    // Step 1: Load all KB documents
    console.log("Step 1: Loading KB documents...");
    const documents = await loadKBDocuments();

    if (documents.length === 0) {
      console.error("No documents found! Make sure KB files are in the correct location.");
      process.exit(1);
    }

    console.log();

    // Step 2: Create vector store and index documents
    console.log("Step 2: Creating vector store and indexing documents...");
    await createVectorStore(documents);

    console.log();
    console.log("=".repeat(50));
    console.log("Knowledge Base seeding complete!");
    console.log("You can now start the chatbot with: pnpm dev");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Error seeding knowledge base:", error);
    process.exit(1);
  }
}

// Run the seeding
seedKnowledgeBase();
