// app/read/page.tsx
'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BookReader from '@/components/BookReader';
import { getAllBooks } from '@/lib/bibleData';

function ReadPageContent() {
  const searchParams = useSearchParams();
  const [selectedReading, setSelectedReading] = useState<{
    bookCode: string;
    chapter: number;
    bookName: string;
    highlightStart?: number;
    highlightEnd?: number;
  } | null>(null);

  useEffect(() => {
    const bookCode = searchParams.get('book');
    const chapterStr = searchParams.get('chapter');
    const highlightStr = searchParams.get('highlight');
    
    if (bookCode && chapterStr) {
      const chapter = parseInt(chapterStr);
      const allBooks = getAllBooks();
      const book = allBooks.find(b => b.code === bookCode);
      
      if (book) {
        let highlightStart: number | undefined;
        let highlightEnd: number | undefined;
        
        if (highlightStr) {
          const [start, end] = highlightStr.split('-').map(Number);
          highlightStart = start;
          highlightEnd = end || start;
        }
        
        setSelectedReading({
          bookCode,
          chapter,
          bookName: book.name,
          highlightStart,
          highlightEnd,
        });
      }
    }
  }, [searchParams]);

  const handleSelectChapter = (
    bookCode: string, 
    chapter: number, 
    bookName: string,
    highlightStart?: number,
    highlightEnd?: number
  ) => {
    setSelectedReading({ bookCode, chapter, bookName, highlightStart, highlightEnd });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEF9E7] to-[#F5E6D3]">
      <Sidebar 
        onSelectChapter={handleSelectChapter}
        currentBookCode={selectedReading?.bookCode || ''}
        currentChapter={selectedReading?.chapter || 1}
        currentBookName={selectedReading?.bookName || ''}
      />
      
      {selectedReading ? (
        <BookReader
          bookCode={selectedReading.bookCode}
          chapter={selectedReading.chapter}
          bookName={selectedReading.bookName}
          highlightStart={selectedReading.highlightStart}
          highlightEnd={selectedReading.highlightEnd}
          onChapterChange={handleSelectChapter}
        />
      ) : (
        <div className="text-center" style={{ marginTop: '80px' }}>
          <h1 className="text-4xl font-bold text-[#654321] mb-4">
            Kinh Thánh Tiếng Việt
          </h1>
          <p className="text-[#654321] mb-2">
            Chọn sách và chương từ thanh điều hướng để bắt đầu đọc
          </p>
        </div>
      )}
    </main>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEF9E7] to-[#F5E6D3]">
        <div className="text-center">
          <div className="text-xl text-[#654321]">Đang tải...</div>
        </div>
      </main>
    }>
      <ReadPageContent />
    </Suspense>
  );
}