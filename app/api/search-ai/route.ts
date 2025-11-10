// app/api/search-ai/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { 
  parseExactReference, 
  exactSearch, 
  semanticSearch, 
  scopedSemanticSearch 
} from '@/lib/searchTools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const AI_ROUTER_SYSTEM_PROMPT = `Phân loại câu hỏi tìm kiếm Kinh Thánh và tối ưu query.

LOẠI TÌM KIẾM:
- exact: Có tên sách + số (VD: "Thi thiên 23", "Giăng 3:16")
- semantic: Chủ đề/cảm xúc chung (VD: "cô đơn", "Tại sao người tốt khổ?")
- scoped: Tìm trong sách cụ thể (VD: "tình yêu trong Giăng")

LÀM RÕ QUERY (semantic/scoped):
Mục tiêu: Từ khóa giúp vector search tìm câu Kinh Thánh đúng nhất.

Quy tắc:
1. Giữ chủ đề chính + thêm ngữ cảnh Kinh Thánh
2. Cảm xúc → thêm "Chúa [can thiệp]"
   "cô đơn" → "cô đơn, Chúa ở cùng, an ủi"
3. Câu hỏi triết học → khái niệm thần học
   "Tại sao người tốt khổ?" → "người công chính khổ đau, thử thách, kế hoạch Chúa"
4. "Làm sao" → hành động + đức tính
   "Làm sao tha thứ?" → "tha thứ, yêu kẻ thù, lòng thương xót"
5. Mô tả mơ hồ → nhận diện nhân vật/sự kiện
   "Con cá nuốt người" → "Giô-na, cá lớn nuốt"
6. Tối đa 12 từ, ngắn gọn

VÍ DỤ:
"Thi thiên 23" → {"searchType":"exact","bookCode":"PSA","chapter":23}
"cô đơn" → {"searchType":"semantic","clarifiedQuery":"cô đơn, Chúa ở cùng, an ủi"}
"tình yêu trong Giăng" → {"searchType":"scoped","clarifiedQuery":"tình yêu, yêu thương Chúa","bookCode":"JHN","bookName":"Giăng"}

TRẢ VỀ JSON:
{"searchType":"exact|semantic|scoped","clarifiedQuery":"...","bookCode":"...","bookName":"...","chapter":...}`;

export async function POST(request: NextRequest) {
  console.log('\n========== NEW SEARCH REQUEST ==========');
  
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Helper: Stream message
  const sendMessage = async (message: string) => {
    console.log('[Stream]', message);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ message })}\n\n`));
  };
  
  // Helper: Stream result
  const sendResult = async (result: any) => {
    console.log('[Stream] Sending result:', result.type);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`));
  };
  
  // Helper: Stream error
  const sendError = async (error: string) => {
    console.error('[Stream] Error:', error);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`));
  };
  
  // Start processing in background
  (async () => {
    try {
      const body = await request.json();
      const { query } = body;
      
      if (!query?.trim()) {
        await sendError('Vui lòng nhập câu hỏi');
        await writer.close();
        return;
      }
      
      console.log('[Input] User query:', query);
      
      // ĐỒNG THỜI: Stream message + Call AI
      console.log('[Parallel] Starting stream + AI router...');
      
      const [_, aiResponse] = await Promise.all([
        // Task 1: Stream ngay lập tức (không chờ)
        sendMessage('Tôi sẽ bắt đầu tìm hiểu vấn đề của bạn...'),
        
        // Task 2: Call AI router (chạy song song)
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: AI_ROUTER_SYSTEM_PROMPT },
            { role: 'user', content: query }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })
      ]);
      
      const decision = JSON.parse(aiResponse.choices[0].message.content || '{}');
      console.log('[AI Router] ✓ Decision:', JSON.stringify(decision));
      
      const { searchType, clarifiedQuery, bookCode, chapter } = decision;
      
      // Execute based on decision
      if (searchType === 'exact') {
        if (!bookCode || !chapter) {
          throw new Error('AI router thiếu bookCode hoặc chapter cho exact search');
        }
        
        await sendMessage('Đây là đoạn Kinh Thánh mà bạn cần');
        const result = await exactSearch(bookCode, chapter);
        await sendResult(result);
        
      } else if (searchType === 'semantic') {
        const queryToUse = clarifiedQuery || query;
        await sendMessage(`Tôi sẽ tìm Lời Chúa liên quan đến: ${queryToUse}`);
        
        const result = await semanticSearch(queryToUse);
        await sendResult(result);
        
      } else if (searchType === 'scoped') {
        if (!bookCode) {
          throw new Error('AI router thiếu bookCode cho scoped search');
        }
        
        const queryToUse = clarifiedQuery || query;
        const scopeText = chapter 
          ? `${decision.bookName || bookCode} chương ${chapter}`
          : `sách ${decision.bookName || bookCode}`;
          
        await sendMessage(`Tôi sẽ tìm Lời Chúa trong ${scopeText}, liên quan đến: ${queryToUse}`);
        
        const result = await scopedSemanticSearch(queryToUse, bookCode, chapter);
        await sendResult(result);
        
      } else {
        throw new Error(`Unknown searchType: ${searchType}`);
      }
      
      console.log('[Success] Search completed');
      await writer.close();
      
    } catch (error: any) {
      console.error('[Fatal Error]', error);
      await sendError(error.message || 'Có lỗi xảy ra khi tìm kiếm');
      await writer.close();
    }
  })();
  
  // Return streaming response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}