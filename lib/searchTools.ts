// lib/searchTools.ts
import OpenAI from 'openai';
import qdrantClient, { COLLECTION_NAME } from '@/lib/qdrant';
import { getChapter, getAllBooks } from '@/lib/bibleData';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Map tên sách sang bookCode
const bookNameMap: { [key: string]: string } = {
  // Cựu Ước
  'sáng thế ký': 'GEN', 'sáng-thế ký': 'GEN', 'sáng thế': 'GEN', 'sáng': 'GEN', 'genesis': 'GEN',
  'xuất': 'EXO', 'xuất ê-díp-tô ký': 'EXO', 'exodus': 'EXO',
  'lê-vi ký': 'LEV', 'lê vi ký': 'LEV', 'leviticus': 'LEV',
  'dân số ký': 'NUM', 'dân-số ký': 'NUM', 'numbers': 'NUM',
  'phục truyền': 'DEU', 'phục-truyền luật-lệ ký': 'DEU', 'deuteronomy': 'DEU',
  'giô-suê': 'JOS', 'giô suê': 'JOS', 'joshua': 'JOS',
  'các quan xét': 'JDG', 'judges': 'JDG',
  'ru-tơ': 'RUT', 'ru tơ': 'RUT', 'ruth': 'RUT',
  'i sa-mu-ên': '1SA', '1 sa-mu-ên': '1SA', '1 samuel': '1SA',
  'ii sa-mu-ên': '2SA', '2 sa-mu-ên': '2SA', '2 samuel': '2SA',
  'i các vua': '1KI', '1 các vua': '1KI', '1 kings': '1KI',
  'ii các vua': '2KI', '2 các vua': '2KI', '2 kings': '2KI',
  'i sử ký': '1CH', 'i sử-ký': '1CH', '1 chronicles': '1CH',
  'ii sử ký': '2CH', 'ii sử-ký': '2CH', '2 chronicles': '2CH',
  'ê-xơ-ra': 'EZR', 'ê xơ ra': 'EZR', 'ezra': 'EZR',
  'nê-hê-mi': 'NEH', 'nê hê mi': 'NEH', 'nehemiah': 'NEH',
  'ê-xơ-tê': 'EST', 'ê xơ tê': 'EST', 'esther': 'EST',
  'gióp': 'JOB', 'job': 'JOB',
  'thi thiên': 'PSA', 'thi-thiên': 'PSA', 'thi': 'PSA', 'psalm': 'PSA', 'psalms': 'PSA',
  'châm ngôn': 'PRO', 'châm-ngôn': 'PRO', 'proverbs': 'PRO',
  'truyền đạo': 'ECC', 'truyền-đạo': 'ECC', 'ecclesiastes': 'ECC',
  'nhã ca': 'SNG', 'nhã-ca': 'SNG', 'song of solomon': 'SNG',
  'ê-sai': 'ISA', 'ê sai': 'ISA', 'isaiah': 'ISA',
  'giê-rê-mi': 'JER', 'giê rê mi': 'JER', 'jeremiah': 'JER',
  'ca thương': 'LAM', 'ca-thương': 'LAM', 'lamentations': 'LAM',
  'ê-xê-chi-ên': 'EZK', 'ê xê chi ên': 'EZK', 'ezekiel': 'EZK',
  'đa-ni-ên': 'DAN', 'đa ni ên': 'DAN', 'daniel': 'DAN',
  'ô-sê': 'HOS', 'ô sê': 'HOS', 'hosea': 'HOS',
  'giô-ên': 'JOL', 'giô ên': 'JOL', 'joel': 'JOL',
  'a-mốt': 'AMO', 'a mốt': 'AMO', 'amos': 'AMO',
  'áp-đia': 'OBA', 'áp đia': 'OBA', 'obadiah': 'OBA',
  'giô-na': 'JON', 'giô na': 'JON', 'jonah': 'JON',
  'mi-chê': 'MIC', 'mi chê': 'MIC', 'micah': 'MIC',
  'na-hum': 'NAM', 'na hum': 'NAM', 'nahum': 'NAM',
  'ha-ba-cúc': 'HAB', 'ha ba cúc': 'HAB', 'habakkuk': 'HAB',
  'sô-phô-ni': 'ZEP', 'sô phô ni': 'ZEP', 'zephaniah': 'ZEP',
  'a-ghê': 'HAG', 'a ghê': 'HAG', 'haggai': 'HAG',
  'xa-cha-ri': 'ZEC', 'xa cha ri': 'ZEC', 'zechariah': 'ZEC',
  'ma-la-chi': 'MAL', 'ma la chi': 'MAL', 'malachi': 'MAL',
  
  // Tân Ước
  'ma-thi-ơ': 'MAT', 'ma thi ơ': 'MAT', 'matthew': 'MAT',
  'mác': 'MRK', 'mark': 'MRK',
  'lu-ca': 'LUK', 'lu ca': 'LUK', 'luke': 'LUK',
  'giăng': 'JHN', 'john': 'JHN',
  'công vụ': 'ACT', 'công-vụ các sứ-đồ': 'ACT', 'acts': 'ACT',
  'rô-ma': 'ROM', 'rô ma': 'ROM', 'romans': 'ROM',
  'i cô-rinh-tô': '1CO', '1 corinthians': '1CO',
  'ii cô-rinh-tô': '2CO', '2 corinthians': '2CO',
  'ga-la-ti': 'GAL', 'ga la ti': 'GAL', 'galatians': 'GAL',
  'ê-phê-sô': 'EPH', 'ê phê sô': 'EPH', 'ephesians': 'EPH',
  'phi-líp': 'PHP', 'phi líp': 'PHP', 'philippians': 'PHP',
  'cô-lô-se': 'COL', 'cô lô se': 'COL', 'colossians': 'COL',
  'i tê-sa-lô-ni-ca': '1TH', '1 thessalonians': '1TH',
  'ii tê-sa-lô-ni-ca': '2TH', '2 thessalonians': '2TH',
  'i ti-mô-thê': '1TI', '1 timothy': '1TI',
  'ii ti-mô-thê': '2TI', '2 timothy': '2TI',
  'tít': 'TIT', 'titus': 'TIT',
  'phi-lê-môn': 'PHM', 'phi lê môn': 'PHM', 'philemon': 'PHM',
  'hê-bơ-rơ': 'HEB', 'hê bơ rơ': 'HEB', 'hebrews': 'HEB',
  'gia-cơ': 'JAS', 'gia cơ': 'JAS', 'james': 'JAS',
  'i phi-e-rơ': '1PE', '1 peter': '1PE',
  'ii phi-e-rơ': '2PE', '2 peter': '2PE',
  'i giăng': '1JN', '1 john': '1JN',
  'ii giăng': '2JN', '2 john': '2JN',
  'iii giăng': '3JN', '3 john': '3JN',
  'giu-đe': 'JUD', 'giu đe': 'JUD', 'jude': 'JUD',
  'khải huyền': 'REV', 'khải-huyền': 'REV', 'revelation': 'REV'
};

// Parse book name to code
function findBookCode(bookName: string): string | null {
  console.log('[findBookCode] Input:', bookName);
  
  const normalized = bookName.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[-_]/g, ' ');
  
  console.log('[findBookCode] Normalized:', normalized);
  
  // Exact match
  if (bookNameMap[normalized]) {
    console.log('[findBookCode] ✓ Exact match:', bookNameMap[normalized]);
    return bookNameMap[normalized];
  }
  
  // Partial match
  for (const [name, code] of Object.entries(bookNameMap)) {
    if (name.includes(normalized) || normalized.includes(name)) {
      console.log('[findBookCode] ✓ Partial match:', code);
      return code;
    }
  }
  
  console.log('[findBookCode] ✗ No match found');
  return null;
}

// Parse exact reference (Thi thiên 23, Giăng 3:16)
export function parseExactReference(query: string): {
  bookCode: string | null;
  bookName: string | null;
  chapter: number | null;
  verse: number | null;
} {
  console.log('[parseExactReference] Input query:', query);
  
  // Pattern: "Tên sách + số chương" hoặc "Tên sách + số chương:số câu"
  const pattern = /^([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s\-]+)\s*(\d+)(?::(\d+))?$/i;
  
  const match = query.trim().match(pattern);
  
  if (!match) {
    console.log('[parseExactReference] ✗ No pattern match');
    return { bookCode: null, bookName: null, chapter: null, verse: null };
  }
  
  const bookName = match[1].trim();
  const chapter = parseInt(match[2]);
  const verse = match[3] ? parseInt(match[3]) : null;
  
  const bookCode = findBookCode(bookName);
  
  console.log('[parseExactReference] ✓ Parsed:', { bookCode, bookName, chapter, verse });
  
  return { bookCode, bookName, chapter, verse };
}

// Tool 1: Exact Search
export async function exactSearch(bookCode: string, chapter: number): Promise<any> {
  console.log('[exactSearch] Searching:', { bookCode, chapter });
  
  try {
    const verses = getChapter(bookCode, chapter.toString());
    
    if (!verses || verses.length === 0) {
      console.log('[exactSearch] ✗ Chapter not found');
      throw new Error(`Không tìm thấy chương ${chapter} trong sách ${bookCode}`);
    }
    
    console.log('[exactSearch] ✓ Found', verses.length, 'verses');
    
    // Lấy 3 chunks đầu tiên (mỗi chunk ~5-10 câu)
    const chunkSize = Math.ceil(verses.length / 3);
    const chunks = [
      verses.slice(0, Math.min(chunkSize, verses.length)),
      verses.slice(chunkSize, Math.min(chunkSize * 2, verses.length)),
      verses.slice(chunkSize * 2, verses.length)
    ].filter(chunk => chunk.length > 0);
    
    const allBooks = getAllBooks();
    const book = allBooks.find(b => b.code === bookCode);
    
    return {
      type: 'exact',
      bookCode,
      bookName: book?.name || bookCode,
      chapter,
      chunks: chunks.map((chunk, idx) => ({
        verseStart: parseInt(chunk[0].verseNum.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '')),
        verseEnd: parseInt(chunk[chunk.length - 1].verseNum.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '')),
        text: chunk.map(v => v.text).join(' ')
      }))
    };
    
  } catch (error: any) {
    console.error('[exactSearch] ✗ Error:', error.message);
    throw error;
  }
}

// Tool 2: Semantic Search (toàn bộ Kinh Thánh)
export async function semanticSearch(query: string, limit: number = 3): Promise<any> {
  console.log('[semanticSearch] Query:', query);
  
  try {
    // Create embedding
    console.log('[semanticSearch] Creating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const queryVector = embeddingResponse.data[0].embedding;
    console.log('[semanticSearch] ✓ Embedding created');
    
    // Search in Qdrant
    console.log('[semanticSearch] Searching Qdrant...');
    const searchResults = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
      with_payload: true,
    });
    
    console.log('[semanticSearch] ✓ Found', searchResults.length, 'results');
    
    const results = searchResults.map((result) => ({
      id: result.payload?.chunkId || result.id,
      score: result.score,
      payload: {
        bookCode: result.payload?.bookCode,
        bookName: result.payload?.bookName,
        chapter: result.payload?.chapter,
        verseStart: result.payload?.verseStart,
        verseEnd: result.payload?.verseEnd,
        text: result.payload?.text,
        testament: result.payload?.testament,
      },
    }));
    
    return {
      type: 'semantic',
      results
    };
    
  } catch (error: any) {
    console.error('[semanticSearch] ✗ Error:', error.message);
    throw error;
  }
}

// Tool 3: Scoped Semantic Search (trong 1 sách/chương cụ thể)
export async function scopedSemanticSearch(
  query: string,
  bookCode: string,
  chapter?: number,
  limit: number = 3
): Promise<any> {
  console.log('[scopedSemanticSearch] Query:', query, 'in', bookCode, chapter);
  
  try {
    // Create embedding
    console.log('[scopedSemanticSearch] Creating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const queryVector = embeddingResponse.data[0].embedding;
    console.log('[scopedSemanticSearch] ✓ Embedding created');
    
    // Build filter
    const mustConditions: any[] = [
      { key: 'bookCode', match: { value: bookCode } }
    ];
    
    if (chapter) {
      mustConditions.push({ key: 'chapter', match: { value: chapter } });
    }
    
    const filter = { must: mustConditions };
    console.log('[scopedSemanticSearch] Filter:', JSON.stringify(filter));
    
    // Search in Qdrant with filter
    console.log('[scopedSemanticSearch] Searching Qdrant...');
    const searchResults = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
      filter,
      with_payload: true,
    });
    
    console.log('[scopedSemanticSearch] ✓ Found', searchResults.length, 'results');
    
    const results = searchResults.map((result) => ({
      id: result.payload?.chunkId || result.id,
      score: result.score,
      payload: {
        bookCode: result.payload?.bookCode,
        bookName: result.payload?.bookName,
        chapter: result.payload?.chapter,
        verseStart: result.payload?.verseStart,
        verseEnd: result.payload?.verseEnd,
        text: result.payload?.text,
        testament: result.payload?.testament,
      },
    }));
    
    const allBooks = getAllBooks();
    const book = allBooks.find(b => b.code === bookCode);
    
    return {
      type: 'scoped',
      scope: {
        bookCode,
        bookName: book?.name || bookCode,
        chapter
      },
      results
    };
    
  } catch (error: any) {
    console.error('[scopedSemanticSearch] ✗ Error:', error.message);
    throw error;
  }
}