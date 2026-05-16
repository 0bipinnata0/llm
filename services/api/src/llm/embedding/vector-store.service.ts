import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EmbeddingService } from "./embedding.service";

export interface VectorDocument {
  content: string;
  metadata: object;
}

const INITIAL_DOCS = [
  { path: "workspace/policies/return-policy.md", name: "return-policy.md" },
  { path: "workspace/policies/refund-policy.md", name: "refund-policy.md" },
  { path: "workspace/faq/after-sale-faq.md", name: "after-sale-faq.md" },
];

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private vectorStore: MemoryVectorStore | null = null;

  constructor(private readonly embeddingService: EmbeddingService) {}

  async onModuleInit() {
    const docs: VectorDocument[] = [];

    for (const doc of INITIAL_DOCS) {
      const fullPath = resolve(process.cwd(), doc.path);
      try {
        const content = readFileSync(fullPath, "utf-8");
        const paragraphs = splitIntoParagraphs(content);
        for (const paragraph of paragraphs) {
          docs.push({
            content: paragraph,
            metadata: { source: doc.name },
          });
        }
      } catch {
        // ignore missing initial docs
      }
    }

    if (docs.length > 0) {
      await this.addDocuments(docs);
    }
  }

  async addDocuments(docs: VectorDocument[]) {
    const texts = docs.map((d) => d.content);
    const embeddings = await this.embeddingService.embedDocuments(texts);

    const store = await MemoryVectorStore.fromTexts(
      texts,
      docs.map((d) => d.metadata),
      {
        embedQuery: (q) => this.embeddingService.embedQuery(q),
        embedDocuments: () => Promise.resolve(embeddings),
      },
    );

    this.vectorStore = store;
    return { stored: docs.length };
  }

  async similaritySearch(query: string, topK: number) {
    if (!this.vectorStore) {
      throw new Error("Vector store is empty. Call addDocuments first.");
    }

    const results = await this.vectorStore.similaritySearch(query, topK);
    return results.map((r) => ({
      content: r.pageContent,
      metadata: r.metadata,
    }));
  }
}
