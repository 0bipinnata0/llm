import { Injectable } from "@nestjs/common";
import { pipeline } from "@xenova/transformers";

@Injectable()
export class EmbeddingService {
  private embedder = pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");

  async embedQuery(text: string): Promise<number[]> {
    const output = await (
      await this.embedder
    )(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const doc of documents) {
      results.push(await this.embedQuery(doc));
    }
    return results;
  }
}
