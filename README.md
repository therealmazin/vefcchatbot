# VEFC Vocational Expert Chatbot

An AI-powered vocational rehabilitation assistant that provides expert guidance on job analysis, DOT codes, physical demands, and case management. Built with RAG (Retrieval-Augmented Generation) to deliver accurate, knowledge-based responses.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-orange)
![LangChain](https://img.shields.io/badge/LangChain-RAG-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Overview

This chatbot serves as a **Vocational Expert Assistant** designed to help vocational rehabilitation professionals, counselors, and attorneys navigate complex vocational data. It uses a custom knowledge base containing:

- **SkillTRAN Job Analysis Reports** - Detailed DOT code information, SVP levels, physical demands
- **Michael's Case Study** - A comprehensive vocational rehabilitation case involving a 34-year-old individual with T10 spinal cord injury seeking career transition to HR
- **DOL Standard Definitions** - Official Department of Labor work function definitions
- **Vocational Profile Instructions** - Job analysis procedures and methodologies

### Michael's Case - Primary Use Case

The chatbot is specifically trained on **Michael's case**, a vocational rehabilitation scenario involving:

| Attribute | Details |
|-----------|---------|
| **Client** | 34-year-old Asian American male |
| **Injury** | T10 incomplete spinal cord injury from motor vehicle accident |
| **Background** | Former retail assistant manager with BA in Business Administration |
| **Goal** | Transition to Human Resources role focusing on diversity and inclusion |
| **Challenges** | Physical limitations, lack of direct HR experience, adapting to new career path |

The chatbot can answer questions about Michael's strengths, challenges, transferable skills, recommended accommodations, and suitable job matches based on his vocational profile.

## Features

- **Instant DOT Code Lookup** - Get detailed job classifications, SVP levels, and O*NET codes
- **Physical Demands Analysis** - Understand strength requirements, environmental conditions, and work positions
- **Case-Specific Guidance** - Expert insights on Michael's vocational rehabilitation case
- **Training Requirements** - Education levels, certifications, and preparation time for positions
- **Real-time Streaming** - Responses stream as they're generated for better UX
- **Source Attribution** - See which documents informed each response

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| LLM | Groq + Llama 3.3 70B Versatile |
| RAG | LangChain.js |
| Embeddings | HuggingFace Transformers (Xenova/all-MiniLM-L6-v2) |
| Vector Store | Custom in-memory store with cosine similarity |
| Document Loaders | PDF + DOCX support via LangChain |
| Styling | Tailwind CSS |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Question                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vector Store Search                       │
│         (Find relevant chunks via embeddings)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Context Assembly                         │
│        (Top 5 relevant document chunks)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Groq / Llama 3.3 70B                      │
│         (Generate response with RAG context)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Streaming Response                         │
│            (With source attribution)                         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- [Groq API Key](https://console.groq.com/keys) (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/therealmazin/vefcchatbot.git
   cd vefcchatbot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   # Create .env.local file
   echo 'GROQ_API_KEY="your_groq_api_key_here"' > .env.local
   ```

4. **Add your Knowledge Base documents**

   Create a folder structure for your documents:
   ```
   ../KB/Avatar Knowledge/
   ├── SkillTRAN-HR Specialist Job Analysis.pdf
   ├── SkillTRAN-Human Resource Specialist.pdf
   ├── 7110 Qs for AI.docx
   ├── 7110 Michael's Case and Talking points.docx
   ├── Vocational Profile Instruction -Job Analysis.docx
   ├── W&F2012_Standard DOL Definitions.docx
   └── Online Resources.docx
   ```

5. **Seed the Knowledge Base**
   ```bash
   pnpm seed-kb
   ```
   This indexes all documents and creates embeddings (takes 2-5 minutes on first run).

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Example Questions

### About Michael's Case
- "Tell me about Michael's case"
- "What are Michael's strengths and challenges?"
- "What transferable skills does Michael have?"
- "What accommodations might Michael need?"
- "Is HR a good career fit for Michael?"

### Job Analysis
- "What is the DOT code for Human Resource Advisor?"
- "What is the SVP level for an HR Specialist?"
- "What are the physical demands for this position?"
- "What education is required for HR work?"

### Technical Vocational Data
- "What does SVP 7 mean?"
- "Explain the strength levels in DOT classifications"
- "What are the work functions for data, people, and things?"

## Project Structure

```
vefcchatbot/
├── app/
│   ├── api/chat/
│   │   └── route.ts        # Chat API with streaming
│   ├── page.tsx            # Chat UI
│   ├── layout.tsx          # App layout
│   └── globals.css         # Styles
├── lib/
│   ├── ai/
│   │   ├── chain.ts        # RAG chain with Groq
│   │   └── prompts.ts      # System prompts
│   └── kb/
│       ├── loader.ts       # Document loaders (PDF/DOCX)
│       └── vectorstore.ts  # Vector store & embeddings
├── scripts/
│   └── seed-kb.ts          # KB indexing script
├── .env.local              # API keys (not committed)
└── .vectorstore-cache.json # Cached embeddings (not committed)
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | Yes |

### Customizing the Knowledge Base

To add your own documents:

1. Place PDF or DOCX files in the KB directory
2. Update `lib/kb/loader.ts` to include your files in `KB_FILES` array
3. Run `pnpm seed-kb` to re-index

### Customizing the System Prompt

Edit `lib/ai/prompts.ts` to modify:
- `VOCATIONAL_SYSTEM_PROMPT` - The AI's persona and expertise
- `RAG_PROMPT_TEMPLATE` - How context is presented to the LLM

## API Reference

### POST /api/chat

Send a message to the chatbot.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "What is the DOT code for HR Advisor?" }
  ],
  "stream": true
}
```

**Response:** Server-Sent Events stream with:
- `{ "content": "chunk" }` - Text chunks
- `{ "done": true, "sources": [...] }` - Final message with sources

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add `GROQ_API_KEY` environment variable
4. Deploy

**Note:** You'll need to seed the KB locally and include the `.vectorstore-cache.json` in deployment, or implement a cloud-based vector store.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Groq](https://groq.com) - Ultra-fast LLM inference
- [LangChain](https://langchain.com) - RAG framework
- [SkillTRAN](https://skilltran.com) - Vocational data source
- [HuggingFace](https://huggingface.co) - Embedding models

---

Built with expertise in vocational rehabilitation and AI by [therealmazin](https://github.com/therealmazin)
