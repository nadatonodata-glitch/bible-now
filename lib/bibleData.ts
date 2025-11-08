// lib/bibleData.ts
import bibleJson from '@/data/bible-vie1934.json';
import { BibleData } from '@/types/bible';

export const bibleData: BibleData = bibleJson as BibleData;

// Bảng tra cứu tên đầy đủ của các sách Kinh Thánh
const bookNames: { [key: string]: string } = {
  // Cựu Ước
  "GEN": "Sáng-thế Ký",
  "EXO": "Xuất Ê-díp-tô Ký",
  "LEV": "Lê-vi Ký",
  "NUM": "Dân-số Ký",
  "DEU": "Phục-truyền Luật-lệ Ký",
  "JOS": "Giô-suê",
  "JDG": "Các Quan Xét",
  "RUT": "Ru-tơ",
  "1SA": "I Sa-mu-ên",
  "2SA": "II Sa-mu-ên",
  "1KI": "I Các Vua",
  "2KI": "II Các Vua",
  "1CH": "I Sử-ký",
  "2CH": "II Sử-ký",
  "EZR": "Ê-xơ-ra",
  "NEH": "Nê-hê-mi",
  "EST": "Ê-xơ-tê",
  "JOB": "Gióp",
  "PSA": "Thi-thiên",
  "PRO": "Châm-ngôn",
  "ECC": "Truyền-đạo",
  "SNG": "Nhã-ca",
  "ISA": "Ê-sai",
  "JER": "Giê-rê-mi",
  "LAM": "Ca-thương",
  "EZK": "Ê-xê-chi-ên",
  "DAN": "Đa-ni-ên",
  "HOS": "Ô-sê",
  "JOL": "Giô-ên",
  "AMO": "A-mốt",
  "OBA": "Áp-đia",
  "JON": "Giô-na",
  "MIC": "Mi-chê",
  "NAM": "Na-hum",
  "HAB": "Ha-ba-cúc",
  "ZEP": "Sô-phô-ni",
  "HAG": "A-ghê",
  "ZEC": "Xa-cha-ri",
  "MAL": "Ma-la-chi",
  
  // Tân Ước
  "MAT": "Ma-thi-ơ",
  "MRK": "Mác",
  "LUK": "Lu-ca",
  "JHN": "Giăng",
  "ACT": "Công-vụ các Sứ-đồ",
  "ROM": "Rô-ma",
  "1CO": "I Cô-rinh-tô",
  "2CO": "II Cô-rinh-tô",
  "GAL": "Ga-la-ti",
  "EPH": "Ê-phê-sô",
  "PHP": "Phi-líp",
  "COL": "Cô-lô-se",
  "1TH": "I Tê-sa-lô-ni-ca",
  "2TH": "II Tê-sa-lô-ni-ca",
  "1TI": "I Ti-mô-thê",
  "2TI": "II Ti-mô-thê",
  "TIT": "Tít",
  "PHM": "Phi-lê-môn",
  "HEB": "Hê-bơ-rơ",
  "JAS": "Gia-cơ",
  "1PE": "I Phi-e-rơ",
  "2PE": "II Phi-e-rơ",
  "1JN": "I Giăng",
  "2JN": "II Giăng",
  "3JN": "III Giăng",
  "JUD": "Giu-đe",
  "REV": "Khải-huyền"
};

export function getBook(bookCode: string) {
  return bibleData[bookCode];
}

export function getChapter(bookCode: string, chapterNum: string) {
  const book = getBook(bookCode);
  return book?.chapters[chapterNum] || [];
}

export function getAllBooks() {
  return Object.entries(bibleData).map(([code, book]) => ({
    code,
    name: bookNames[code] || book.name || code, // Dùng tên đầy đủ từ bảng tra cứu
    totalChapters: Object.keys(book.chapters).length
  }));
}