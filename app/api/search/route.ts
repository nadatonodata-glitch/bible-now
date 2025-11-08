// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import qdrantClient, { COLLECTION_NAME } from '@/lib/qdrant';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface SearchRequest {
  query: string;
  limit?: number;
  filter?: {
    testament?: 'old' | 'new';
    bookCode?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, limit = 10, filter } = body;
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query không được để trống' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Search query:', query);
    
    // Bước 1: Tạo embedding từ query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const queryVector = embeddingResponse.data[0].embedding;
    console.log('✓ Đã tạo query embedding');
    
    // Bước 2: Tạo filter cho Qdrant (nếu có)
    let qdrantFilter: any = undefined;
    
    if (filter) {
      const mustConditions: any[] = [];
      
      if (filter.testament) {
        mustConditions.push({
          key: 'testament',
          match: { value: filter.testament },
        });
      }
      
      if (filter.bookCode) {
        mustConditions.push({
          key: 'bookCode',
          match: { value: filter.bookCode },
        });
      }
      
      if (mustConditions.length > 0) {
        qdrantFilter = { must: mustConditions };
      }
    }
    
    // Bước 3: Tìm kiếm trong Qdrant
    const searchResults = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
      filter: qdrantFilter,
      with_payload: true,
    });
    
    console.log(`✓ Tìm thấy ${searchResults.length} kết quả`);
    
    // Bước 4: Format kết quả
    const results = searchResults.map((result) => ({
      id: result.payload?.chunkId || result.id, // Dùng chunkId từ payload
      score: result.score,
      payload: {
        bookCode: result.payload?.bookCode,
        bookName: result.payload?.bookName,
        chapter: result.payload?.chapter,
        verseStart: result.payload?.verseStart,
        verseEnd: result.payload?.verseEnd,
        text: result.payload?.text,
        testament: result.payload?.testament,
        wordCount: result.payload?.wordCount,
      },
    }));
    
    return NextResponse.json({ results });
    
  } catch (error: any) {
    console.error('❌ Lỗi search:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tìm kiếm', details: error.message },
      { status: 500 }
    );
  }
}