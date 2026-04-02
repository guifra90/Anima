
import { searchKnowledge } from './anima';

async function test() {
  const query = "Scrivi un post per Linkedin basandoti sui trend trovati prima sui megatrend del 2026";
  console.log("Testing RAG for query:", query);
  
  // @ts-ignore
  const result = await searchKnowledge(query);
  console.log("--- RAG RESULT ---");
  console.log(result || "NO KNOWLEDGE FOUND");
  console.log("------------------");
}

test();
