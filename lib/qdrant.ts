// lib/qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest';

// Khởi tạo Qdrant client
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

export const COLLECTION_NAME = 'bible_vietnamese';
export const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small

export default qdrantClient;