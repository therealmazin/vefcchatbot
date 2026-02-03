import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { Document } from "@langchain/core/documents";
import path from "path";
import fs from "fs";

// Knowledge Base directory path (relative to project root)
const KB_DIR = path.join(process.cwd(), "..", "KB", "Avatar Knowledge");

// List of all KB files
const KB_FILES = [
  "SkillTRAN-HR Specialist Job Analysis.pdf",
  "SkillTRAN-Human Resource Specialist.pdf",
  "7110 Qs for AI.docx",
  "7110 Michael's Case and Talking points.docx",
  "Vocational Profile Instruction -Job Analysis.docx",
  "W&F2012_Standard DOL Definitions.docx",
  "Online Resources.docx",
];

export async function loadKBDocuments(): Promise<Document[]> {
  const allDocs: Document[] = [];

  console.log("Loading KB documents from:", KB_DIR);

  for (const file of KB_FILES) {
    const filePath = path.join(KB_DIR, file);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    console.log(`Loading: ${file}`);

    try {
      let docs: Document[];

      if (file.endsWith(".pdf")) {
        const loader = new PDFLoader(filePath, {
          splitPages: true,
        });
        docs = await loader.load();
      } else if (file.endsWith(".docx")) {
        const loader = new DocxLoader(filePath);
        docs = await loader.load();
      } else {
        console.warn(`Unsupported file type: ${file}`);
        continue;
      }

      // Add source metadata
      docs.forEach((doc) => {
        doc.metadata.source = file;
        doc.metadata.fileName = file;
      });

      allDocs.push(...docs);
      console.log(`  Loaded ${docs.length} documents from ${file}`);
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  console.log(`Total documents loaded: ${allDocs.length}`);
  return allDocs;
}
