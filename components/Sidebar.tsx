// components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { getAllBooks } from '@/lib/bibleData';

const bibleBooks = getAllBooks();
const oldTestament = bibleBooks.slice(0, 39);
const newTestament = bibleBooks.slice(39);

interface SidebarProps {
  onSelectChapter: (
    bookCode: string, 
    chapter: number, 
    bookName: string,
    highlightStart?: number,
    highlightEnd?: number
  ) => void;
  currentBookCode: string;
  currentChapter: number;
  currentBookName: string;
}

export default function Sidebar({ onSelectChapter, currentBookCode, currentChapter, currentBookName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTestament, setCurrentTestament] = useState<'old' | 'new'>('old');
  const [showPage2, setShowPage2] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ code: string; name: string; chapters: number } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  // Đồng bộ sidebar với BookReader khi BookReader thay đổi
  useEffect(() => {
    const book = bibleBooks.find(b => b.code === currentBookCode);
    if (book) {
      setSelectedBook({ code: book.code, name: book.name, chapters: book.totalChapters });
      setSelectedChapter(currentChapter);
      setShowPage2(true);
      
      // Tự động chuyển testament nếu cần
      const bookIndex = bibleBooks.findIndex(b => b.code === currentBookCode);
      setCurrentTestament(bookIndex < 39 ? 'old' : 'new');
    }
  }, [currentBookCode, currentChapter]);

  const books = currentTestament === 'old' ? oldTestament : newTestament;

  const handleBookClick = (book: typeof bibleBooks[0]) => {
    setSelectedBook({ code: book.code, name: book.name, chapters: book.totalChapters });
    setShowPage2(true);
  };

  const handleChapterClick = (chapter: number) => {
  if (selectedBook) {
    setSelectedChapter(chapter);
    onSelectChapter(selectedBook.code, chapter, selectedBook.name); // Không truyền highlight
    setIsOpen(false);
  }
};

  const handleBack = () => {
    setShowPage2(false);
    setSelectedChapter(null);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * {
          box-sizing: border-box;
        }
        
        .bible-toggle-button {
          position: fixed;
          left: -25px;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          background: #D4AF37;
          border: 3px solid #CD7F32;
          border-radius: 0 50px 50px 0;
          cursor: pointer;
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: left 0.4s ease, border-radius 0.4s ease, box-shadow 0.3s ease;
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
        }

        .bible-toggle-button:hover {
          box-shadow: 2px 0 20px rgba(212, 175, 55, 0.5);
        }

        .bible-toggle-button.open {
          left: 275px;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .bible-toggle-button.open:hover {
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
        }

        .bible-toggle-icon {
          width: 24px;
          height: 24px;
          fill: #FEF9E7;
          position: absolute;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .bible-toggle-icon.hamburger {
          opacity: 1;
          transform: rotate(0deg);
        }

        .bible-toggle-icon.close {
          opacity: 0;
          transform: rotate(90deg);
        }

        .bible-toggle-button.open .bible-toggle-icon.hamburger {
          opacity: 0;
          transform: rotate(-90deg);
        }

        .bible-toggle-button.open .bible-toggle-icon.close {
          opacity: 1;
          transform: rotate(0deg);
        }

        .bible-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 300px;
          height: 100%;
          background: linear-gradient(180deg, #FEF9E7 0%, #F5E6D3 100%);
          border-right: 4px solid #CD7F32;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          transform: translateX(-300px);
          transition: transform 0.4s ease;
          z-index: 1000;
          overflow: hidden;
        }

        .bible-sidebar.open {
          transform: translateX(0);
        }

        .bible-sidebar::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 10px;
          width: 30px;
          height: 30px;
          border-top: 3px solid #D4AF37;
          border-left: 3px solid #D4AF37;
          border-radius: 4px 0 0 0;
        }

        .bible-sidebar::after {
          content: '';
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-top: 3px solid #D4AF37;
          border-right: 3px solid #D4AF37;
          border-radius: 0 4px 0 0;
        }

        .bible-pages-container {
          position: relative;
          width: 600px;
          height: 100%;
          display: flex;
          transition: transform 0.3s ease;
        }

        .bible-pages-container.show-page-2 {
          transform: translateX(-300px);
        }

        .bible-page {
          width: 300px;
          height: 100%;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          padding: 60px 20px 20px;
        }

        .bible-testament-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .bible-testament-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid #CD7F32;
          border-radius: 8px;
          background: #F5E6D3;
          color: #654321;
          font-family: 'Noto Serif', serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .bible-testament-btn:hover {
          background: #EDD9C0;
        }

        .bible-testament-btn.active {
          background: #D4AF37;
          color: #FEF9E7;
          border-color: #D4AF37;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
        }

        .bible-book-list {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }

        .bible-book-item {
          padding: 14px 16px;
          margin-bottom: 8px;
          border: 2px solid #CD7F32;
          border-radius: 8px;
          background: #FEF9E7;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 15px;
          font-weight: 500;
        }

        .bible-book-item:hover {
          background: #F9F0DC;
          border-color: #D4AF37;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
          transform: translateX(4px);
        }

        .bible-page-2-header {
          margin-bottom: 20px;
        }

        .bible-back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 2px solid #CD7F32;
          border-radius: 8px;
          background: #FEF9E7;
          color: #654321;
          font-family: 'Noto Serif', serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 16px;
          width: fit-content;
        }

        .bible-back-button:hover {
          background: #D4AF37;
          color: #FEF9E7;
          border-color: #D4AF37;
        }

        .bible-current-book-name {
          font-size: 18px;
          font-weight: 700;
          color: #654321;
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 3px solid #D4AF37;
          margin-bottom: 20px;
        }

        .bible-chapter-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          overflow-y: auto;
          flex: 1;
          padding-right: 8px;
          align-content: start;
        }

        .bible-chapter-item {
          width: 100%;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #CD7F32;
          border-radius: 8px;
          background: #FEF9E7;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .bible-chapter-item:hover {
          background: #F9F0DC;
          border-color: #D4AF37;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
          transform: scale(1.05);
        }

        .bible-chapter-item.active {
          background: #D4AF37;
          color: #FEF9E7;
          border-color: #D4AF37;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.6);
        }

        .bible-book-list::-webkit-scrollbar,
        .bible-chapter-grid::-webkit-scrollbar {
          width: 8px;
        }

        .bible-book-list::-webkit-scrollbar-track,
        .bible-chapter-grid::-webkit-scrollbar-track {
          background: #F5E6D3;
          border-radius: 4px;
        }

        .bible-book-list::-webkit-scrollbar-thumb,
        .bible-chapter-grid::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 4px;
        }

        .bible-book-list::-webkit-scrollbar-thumb:hover,
        .bible-chapter-grid::-webkit-scrollbar-thumb:hover {
          background: #C19B2E;
        }
      `}} />

      {/* Toggle Button */}
      <div
        className={`bible-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="bible-toggle-icon hamburger" viewBox="0 0 24 24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
        <svg className="bible-toggle-icon close" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </div>

      {/* Sidebar */}
      <div className={`bible-sidebar ${isOpen ? 'open' : ''}`}>
        <div className={`bible-pages-container ${showPage2 ? 'show-page-2' : ''}`}>
          {/* Page 1: Book Selection */}
          <div className="bible-page">
            <div className="bible-testament-toggle">
              <button
                className={`bible-testament-btn ${currentTestament === 'old' ? 'active' : ''}`}
                onClick={() => setCurrentTestament('old')}
              >
                CỰU ƯỚC
              </button>
              <button
                className={`bible-testament-btn ${currentTestament === 'new' ? 'active' : ''}`}
                onClick={() => setCurrentTestament('new')}
              >
                TÂN ƯỚC
              </button>
            </div>
            <div className="bible-book-list">
              {books.map((book) => (
                <div
                  key={book.code}
                  className="bible-book-item"
                  onClick={() => handleBookClick(book)}
                >
                  {book.name}
                </div>
              ))}
            </div>
          </div>

          {/* Page 2: Chapter Selection */}
          <div className="bible-page">
            <div className="bible-page-2-header">
              <button className="bible-back-button" onClick={handleBack}>
                <span>←</span>
                <span>Quay lại</span>
              </button>
              <div className="bible-current-book-name">{selectedBook?.name}</div>
            </div>
            <div className="bible-chapter-grid">
              {selectedBook &&
                Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                  <div
                    key={chapter}
                    className={`bible-chapter-item ${selectedChapter === chapter ? 'active' : ''}`}
                    onClick={() => handleChapterClick(chapter)}
                  >
                    {chapter}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}