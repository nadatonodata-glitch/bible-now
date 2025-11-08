// components/BookReader.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getChapter, getAllBooks } from '@/lib/bibleData';
import { Verse } from '@/types/bible';

interface BookReaderProps {
  bookCode: string;
  chapter: number;
  bookName: string;
  highlightStart?: number;
  highlightEnd?: number;
  onChapterChange: (bookCode: string, chapter: number, bookName: string) => void;
}

export default function BookReader({ 
  bookCode, 
  chapter, 
  bookName, 
  highlightStart,
  highlightEnd,
  onChapterChange 
}: BookReaderProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(4);
  const [pagesData, setPagesData] = useState<Verse[][]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tính toán phân trang
  useEffect(() => {
    const chapterData = getChapter(bookCode, chapter.toString());
    setVerses(chapterData);
    
    if (chapterData.length === 0) {
      setPagesData([]);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    setIsMeasuring(true);
    
    setTimeout(() => {
      if (!measureRef.current) return;

      const maxPageHeight = isMobile ? 500 : 600;
      const pages: Verse[][] = [];
      let currentPageVerses: Verse[] = [];
      let currentHeight = 0;

      const verseElements = measureRef.current.querySelectorAll('.temp-verse');
      
      chapterData.forEach((verse, index) => {
        const verseElement = verseElements[index] as HTMLElement;
        const verseHeight = verseElement ? verseElement.offsetHeight + 8 : 48; // +8 cho margin


        if (pages.length === 0 && currentPageVerses.length === 0) {
          currentHeight += 100;
        }

        if (currentHeight + verseHeight > maxPageHeight && currentPageVerses.length > 0) {
          pages.push([...currentPageVerses]);
          currentPageVerses = [verse];
          currentHeight = verseHeight;
        } else {
          currentPageVerses.push(verse);
          currentHeight += verseHeight;
        }
      });

      if (currentPageVerses.length > 0) {
        pages.push(currentPageVerses);
      }

      setPagesData(pages);
      setTotalPages(pages.length);
      setCurrentPage(1);
      setIsMeasuring(false);
    }, 100);
  }, [bookCode, chapter, isMobile]);

  // Auto scroll to highlighted verse
  useEffect(() => {
    if (!highlightStart || pagesData.length === 0) return;
    
    // Tìm trang chứa verse được highlight
    let targetPage = 1;
    for (let i = 0; i < pagesData.length; i++) {
      const pageVerses = pagesData[i];
      const hasHighlight = pageVerses.some(v => {
        const verseNum = parseInt(v.verseNum);
        return verseNum >= highlightStart && verseNum <= (highlightEnd || highlightStart);
      });
      
      if (hasHighlight) {
        targetPage = i + 1;
        break;
      }
    }
    
    // Delay nhỏ để animation mượt hơn
    setTimeout(() => {
      setCurrentPage(targetPage);
    }, 300);
  }, [highlightStart, highlightEnd, pagesData]);

  // Check if verse should be highlighted
  const isHighlighted = (verseNum: string): boolean => {
    if (!highlightStart) return false;
    const num = parseInt(verseNum);
    return num >= highlightStart && num <= (highlightEnd || highlightStart);
  };

  const allBooks = getAllBooks();
  const currentBookIndex = allBooks.findIndex(b => b.code === bookCode);

  const getNextChapter = () => {
    const currentBook = allBooks[currentBookIndex];
    
    if (chapter < currentBook.totalChapters) {
      return { bookCode, chapter: chapter + 1, bookName };
    }
    
    if (currentBookIndex < allBooks.length - 1) {
      const nextBook = allBooks[currentBookIndex + 1];
      return { bookCode: nextBook.code, chapter: 1, bookName: nextBook.name };
    }
    
    return null;
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      const next = getNextChapter();
      if (next) {
        onChapterChange(next.bookCode, next.chapter, next.bookName);
      }
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Touch/swipe support
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isScrolling = false;
        e.preventDefault();
      } else {
        isScrolling = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY || isScrolling) return;
      
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          nextPage();
        } else {
          previousPage();
        }
      }
      
      startX = 0;
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, bookCode, chapter, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        previousPage();
      } else if (e.key === 'ArrowRight') {
        nextPage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, bookCode, chapter, totalPages])
  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}, [currentPage, bookCode, chapter]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .book-container {
          position: relative;
          width: 90%;
          max-width: 1200px;
          height: 85%;
          perspective: 2000px;
          overflow: hidden;
        }

        .book {
          position: relative;
          width: ${totalPages * 100}%;
          height: 100%;
          display: flex;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: translateX(-${((currentPage - 1) / totalPages) * 100}%);
        }

        .page {
          position: relative;
          width: ${100/totalPages}%;
          height: 100%;
          padding: 4% 5%;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(139, 69, 19, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(139, 69, 19, 0.02) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(139, 69, 19, 0.015) 0%, transparent 40%);
          pointer-events: none;
          z-index: 1;
        }

        .page {
          border-radius: 8px;
          box-shadow: 
            0 5px 20px rgba(0, 0, 0, 0.15),
            inset 0 0 30px rgba(0, 0, 0, 0.05);
          background: linear-gradient(135deg, #FEF9E7 0%, #F5E6D3 100%);
        }

        .corner-decoration {
          position: absolute;
          width: 80px;
          height: 80px;
          z-index: 2;
          opacity: 0.6;
        }

        .corner-decoration svg {
          width: 100%;
          height: 100%;
          fill: #D4AF37;
        }

        .top-left { top: 3%; left: 3%; }
        .top-right { top: 3%; right: 3%; transform: rotate(90deg); }
        .bottom-left { bottom: 3%; left: 3%; transform: rotate(-90deg); }
        .bottom-right { bottom: 3%; right: 3%; transform: rotate(180deg); }

        .chapter-title {
          text-align: center;
          font-family: 'Cinzel Decorative', serif;
          font-size: 2em;
          margin: 0 0 0.5em 0;
          position: relative;
          z-index: 2;
          letter-spacing: 2px;
          color: #800020;
        }

        .chapter-title::after {
          content: '';
          display: block;
          width: 60%;
          height: 2px;
          margin: 0.5em auto 0;
          background: linear-gradient(to right, transparent, currentColor 20%, currentColor 80%, transparent);
        }

        .verse-text {
          font-size: 1.15em;
          line-height: 1.8;
          text-align: justify;
          position: relative;
          z-index: 2;
          hyphens: auto;
          color: #654321;
          font-family: 'Crimson Text', serif;
        }

        .verse-number {
          font-size: 0.7em;
          vertical-align: super;
          font-weight: 600;
          margin-right: 0.2em;
          color: #D4AF37;
        }

        /* Highlight styles */
        .verse-highlighted {
          background: linear-gradient(120deg, rgba(255, 235, 59, 0.3) 0%, rgba(255, 193, 7, 0.2) 100%);
          padding: 4px 8px;
          margin: -4px -8px;
          border-radius: 4px;
          border-left: 3px solid #D4AF37;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
          animation: highlightPulse 2s ease-in-out;
        }

        @keyframes highlightPulse {
          0%, 100% {
            box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
          }
        }

        .illuminated-letter {
          float: left;
          font-size: 4em;
          line-height: 0.8;
          font-family: 'Cinzel Decorative', serif;
          font-weight: 700;
          margin: 0.1em 0.15em 0 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          color: #D4AF37;
        }

        .page-number {
          position: absolute;
          bottom: 4%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.9em;
          font-style: italic;
          z-index: 2;
          color: #654321;
        }

        .cross-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          opacity: 0.03;
          z-index: 0;
        }

        .cross-watermark svg {
          width: 100%;
          height: 100%;
          fill: #8B4513;
        }

        .bookmark {
          position: absolute;
          right: -8px;
          top: 0;
          width: 35px;
          height: 50%;
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
          z-index: 11;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
          transition: transform 0.3s ease;
        }

        .bookmark:hover {
          transform: translateX(3px);
        }

        .bookmark-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.7em;
          font-weight: 600;
          letter-spacing: 1px;
          padding: 10px 0;
          text-align: center;
          width: 100%;
        }

        .navigation {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(139, 69, 19, 0.8);
          color: #FEF9E7;
          border: none;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          font-size: 1.5em;
          cursor: pointer;
          z-index: 20;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navigation:hover {
          background: rgba(139, 69, 19, 1);
          transform: translateY(-50%) scale(1.1);
        }

        .nav-prev {
          left: 20px;
        }

        .nav-next {
          right: 20px;
        }

        .page-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 20;
        }

        .page-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(139, 69, 19, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .page-dot.active {
          background: rgba(139, 69, 19, 0.8);
          transform: scale(1.2);
        }

        @media (max-width: 768px) {
          .book-container {
            width: 95%;
            height: 90%;
          }
          
          .page {
            padding: 2% 2.5%;
          }
          
          .chapter-title {
            font-size: 1.5em;
          }
          
          .verse-text {
            font-size: 1em;
          }
          
          .corner-decoration {
            width: 50px;
            height: 50px;
          }
          
          .navigation {
            display: none;
          }
        }
      `}} />

      {/* Div đo trước khi render */}
      {isMeasuring && (
        <div 
          ref={measureRef} 
          style={{ 
            position: 'absolute', 
            visibility: 'hidden', 
            width: '100%',
            pointerEvents: 'none'
          }}
        >
          {verses.map((verse, index) => (
            <div key={index} className="temp-verse verse-text">
              {index === 0 && (
                <span className="illuminated-letter">{verse.text.charAt(0)}</span>
              )}
              <span className="verse-number">{verse.verseNum}</span>
              {index === 0 ? verse.text.slice(1) : verse.text}
            </div>
          ))}
        </div>
      )}

      <button className="navigation nav-prev" onClick={previousPage}>‹</button>
      <button className="navigation nav-next" onClick={nextPage}>›</button>

      <div className="book-container">
        <div className="page-indicator">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              className={`page-dot ${currentPage === page ? 'active' : ''}`}
              onClick={() => goToPage(page)}
            />
          ))}
        </div>

        <div className="book">
          {pagesData.map((pageVerses, pageIndex) => (
            <div key={pageIndex} className="page">
              <div className="corner-decoration top-left">
                <svg viewBox="0 0 100 100">
                  <path d="M10,10 Q10,40 40,40 L40,45 Q10,45 10,75 L5,75 Q5,45 35,45 L35,40 Q5,40 5,10 Z" opacity="0.7" />
                  <circle cx="45" cy="45" r="3" />
                  <path d="M50,10 L55,25 L70,25 L58,35 L63,50 L50,40 L37,50 L42,35 L30,25 L45,25 Z" opacity="0.5" />
                </svg>
              </div>
              <div className="corner-decoration bottom-right">
                <svg viewBox="0 0 100 100">
                  <path d="M10,10 Q10,40 40,40 L40,45 Q10,45 10,75 L5,75 Q5,45 35,45 L35,40 Q5,40 5,10 Z" opacity="0.7" />
                  <circle cx="45" cy="45" r="3" />
                  <path d="M50,10 L55,25 L70,25 L58,35 L63,50 L50,40 L37,50 L42,35 L30,25 L45,25 Z" opacity="0.5" />
                </svg>
              </div>

              <div className="cross-watermark">
                <svg viewBox="0 0 100 100">
                  <rect x="42" y="10" width="16" height="80" />
                  <rect x="20" y="35" width="60" height="16" />
                </svg>
              </div>

              {pageIndex === 0 && (
                <h2 className="chapter-title">{bookName} {chapter}</h2>
              )}

              <div className="verse-text">
                {pageVerses.map((verse, index) => {
                  const highlighted = isHighlighted(verse.verseNum);
                  return (
                    <span 
                      key={verse.verseNum}
                      className={highlighted ? 'verse-highlighted' : ''}
                    >
                      {pageIndex === 0 && index === 0 && (
                        <span className="illuminated-letter">
                          {verse.text.charAt(0)}
                        </span>
                      )}
                      <span className="verse-number">{verse.verseNum}</span>
                      {pageIndex === 0 && index === 0 ? verse.text.slice(1) : verse.text}{' '}
                    </span>
                  );
                })}
              </div>

              <div className="page-number">{pageIndex + 1}</div>

              {pageIndex === totalPages - 1 && (
                <div className="bookmark">
                  <div className="bookmark-text">{bookName.toUpperCase()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}