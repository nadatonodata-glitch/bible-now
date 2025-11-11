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

const AI_ROUTER_SYSTEM_PROMPT = `Phân loại câu hỏi Kinh Thánh. TRẢ VỀ JSON.

PHÂN LOẠI:

1. EXACT - Tham chiếu trực tiếp (TÊN SÁCH + SỐ CHƯƠNG):
   ✓ "Thi thiên 23"
   ✓ "Giăng 3:16" 
   ✓ "Sáng thế ký chương 5"
   ✓ "Ma-thi-ơ 6"
   → Trả về: searchType="exact", bookCode="...", chapter=...

2. SEMANTIC - Chủ đề/Cảm xúc/Tình huống (KHÔNG có số chương rõ ràng):
   ✓ "Cô đơn"
   ✓ "Làm sao tha thứ"
   ✓ "Chúa tạo ra con người đúng ko"
   ✓ "Tình yêu trong Giăng" (CÓ tên sách NHƯNG không có số chương cụ thể)
   → Trả về: searchType="semantic", clarifiedQuery="..."

3. SCOPED - Tìm chủ đề TRONG sách/chương cụ thể:
   ✓ "Tình yêu trong Giăng chương 3"
   ✓ "Phép lạ trong Ma-thi-ơ"
   → Trả về: searchType="scoped", bookCode="...", chapter (nếu có)

4. INVALID - Không liên quan Kinh Thánh:
   ✗ Toán học, khoa học, tin tức, game, nấu ăn

QUY TẮC QUAN TRỌNG:
- Nếu có TÊN SÁCH + SỐ CHƯƠNG rõ ràng → LUÔN LÀ EXACT
- Nếu chỉ có chủ đề, không có số → SEMANTIC
- bookCode phải là MÃ 3 CHỮ: GEN, EXO, PSA, MAT, JHN...

TRẢ VỀ JSON:
{"searchType":"exact|semantic|scoped|invalid","clarifiedQuery":"...","bookCode":"...","chapter":...}`;

export async function POST(request: NextRequest) {
  console.log('\n========== NEW SEARCH REQUEST ==========');
  
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  const sendMessage = async (message: string) => {
    console.log('[Stream]', message);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ message })}\n\n`));
  };
  
  const sendResult = async (result: any) => {
    console.log('[Stream] Sending result:', result.type);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`));
  };
  
  const sendError = async (error: string) => {
    console.error('[Stream] Error:', error);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`));
  };
  
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
      
      const [_, aiResponse] = await Promise.all([
        sendMessage('Đang phân tích câu hỏi của bạn...'),
        
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
      
      // XỬ LÝ TỪ CHỐI
      if (searchType === 'invalid') {
        await sendMessage('Hmm... câu hỏi này không nằm trong phạm vi Kinh Thánh');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        await sendError(
          'Tôi chỉ có thể tìm Lời Chúa về: cảm xúc, tình huống sống, đạo đức, nhân vật Kinh Thánh, hoặc triết học nhân sinh. Thử hỏi điều khác nhé! 😊'
        );
        await writer.close();
        return;
      }
      
      // XỬ LÝ CÁC LOẠI TÌM KIẾM HỢP LỆ
      if (searchType === 'exact') {
        if (!bookCode || !chapter) {
          throw new Error('AI router thiếu bookCode hoặc chapter');
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
          throw new Error('AI router thiếu bookCode');
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
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}