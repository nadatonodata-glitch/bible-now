// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  score: number;
  payload: {
    bookCode: string;
    bookName: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
    text: string;
    testament: 'old' | 'new';
    wordCount: number;
  };
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!query.trim() || loading) return;
    
    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 3 }),
      });
      
      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi tìm kiếm');
      }
      
      const data = await response.json();
      setResults(data.results);
      setHasSearched(true);
      
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(
    `/read?book=${result.payload.bookCode}&chapter=${result.payload.chapter}&highlight=${result.payload.verseStart}-${result.payload.verseEnd}`
  );
};

  const truncateText = (text: string, maxLength: number = 120) => {
    const cleanText = text.replace(/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  const getMatchLevel = (score: number) => {
    if (score >= 0.9) return 'Rất phù hợp';
    if (score >= 0.8) return 'Phù hợp';
    return 'Có liên quan';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body {
          margin: 0;
          padding: 0;
          font-family: 'Noto Serif', serif;
          background: linear-gradient(135deg, #FEF9E7, #F5E6D3);
          min-height: 100vh;
          color: #654321;
          position: relative;
          overflow-x: hidden;
        }

        /* Background Watermark Cross */
        body::before {
          content: '';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23654321'%3E%3Cpath d='M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12S21.1 14 20 14H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V14H4C2.9 14 2 13.1 2 12S2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          opacity: 0.02;
          pointer-events: none;
          z-index: 0;
        }

        .corner-decoration {
          position: fixed;
          width: 60px;
          height: 60px;
          border: 2px solid #CD7F32;
          opacity: 0.3;
          z-index: 1;
          transition: transform 0.3s ease;
        }

        .corner-decoration.top-left {
          top: 20px;
          left: 20px;
          border-right: none;
          border-bottom: none;
        }

        .corner-decoration.top-right {
          top: 20px;
          right: 20px;
          border-left: none;
          border-bottom: none;
        }

        .corner-decoration.bottom-left {
          bottom: 20px;
          left: 20px;
          border-right: none;
          border-top: none;
        }

        .corner-decoration.bottom-right {
          bottom: 20px;
          right: 20px;
          border-left: none;
          border-top: none;
        }

        .home-container {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
          padding: 80px 20px 40px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 50px;
        }

        .hero-cross {
          width: 40px;
          height: 40px;
          fill: #D4AF37;
          margin: 0 auto 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .hero-title {
          font-size: 2.2rem;
          color: #654321;
          margin: 0 0 16px;
          font-weight: 600;
          line-height: 1.4;
        }

        .hero-subtitle {
          font-size: 1rem;
          color: #8B4513;
          font-style: italic;
          margin: 0;
          opacity: 0.85;
        }

        .search-section {
          width: 100%;
          max-width: 600px;
          margin-bottom: 60px;
        }

        .search-box-container {
          position: relative;
          width: 100%;
        }

        .search-box {
          width: 100%;
          height: 60px;
          border: 2px solid #CD7F32;
          border-radius: 30px;
          background: #FFFEF9;
          padding: 0 70px 0 60px;
          font-size: 18px;
          font-family: 'Noto Serif', serif;
          color: #654321;
          outline: none;
          box-shadow: 0 2px 12px rgba(139, 69, 19, 0.1);
          transition: all 0.3s ease;
        }

        .search-box:hover {
          border-color: #D4AF37;
          box-shadow: 0 4px 16px rgba(139, 69, 19, 0.15);
        }

        .search-box:focus {
          border-color: #D4AF37;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
        }

        .search-box::placeholder {
          color: #A0826D;
          font-style: italic;
          transition: opacity 0.2s ease;
        }
        .search-box:focus::placeholder {
  opacity: 0;
}

        .search-icon-left {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          fill: #8B6F47;
          pointer-events: none;
        }

        .search-button {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #D4AF37;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .search-button:hover:not(:disabled) {
          background: #E5C158;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .search-button:active:not(:disabled) {
          transform: translateY(-50%) scale(0.95);
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-icon {
          width: 20px;
          height: 20px;
          fill: #654321;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #654321;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .results-section {
          width: 100%;
          max-width: 700px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
          pointer-events: none;
        }

        .results-section.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .results-header {
          font-size: 15px;
          color: #8B6F47;
          margin-bottom: 24px;
          text-align: left;
          font-weight: 500;
        }

        .result-card {
          background: #FFFEF9;
          border: 2px solid #E8D5B7;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(10px);
        }

        .result-card.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .result-card:hover {
          border-color: #D4AF37;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .result-reference {
          font-size: 18px;
          font-weight: 700;
          color: #654321;
          margin-bottom: 10px;
        }

        .result-text {
          font-size: 16px;
          color: #8B6F47;
          line-height: 1.6;
          margin: 0;
        }

        .result-score {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(212, 175, 55, 0.2);
          color: #654321;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .empty-state {
          text-align: center;
          color: #8B6F47;
          padding: 40px 20px;
          font-style: italic;
          font-size: 16px;
        }

        .error-message {
          background: rgba(220, 20, 60, 0.1);
          border: 2px solid rgba(220, 20, 60, 0.3);
          border-radius: 12px;
          padding: 16px;
          color: #8B0000;
          text-align: center;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .home-container {
            padding: 60px 16px 40px;
          }

          .hero-title {
            font-size: 1.6rem;
          }

          .hero-subtitle {
            font-size: 0.9rem;
          }

          .search-box {
            font-size: 16px;
            height: 52px;
            padding: 0 60px 0 50px;
          }

          .corner-decoration {
            width: 40px;
            height: 40px;
          }

          .corner-decoration.top-left,
          .corner-decoration.top-right {
            top: 10px;
          }

          .corner-decoration.bottom-left,
          .corner-decoration.bottom-right {
            bottom: 10px;
          }

          .corner-decoration.top-left,
          .corner-decoration.bottom-left {
            left: 10px;
          }

          .corner-decoration.top-right,
          .corner-decoration.bottom-right {
            right: 10px;
          }

          .result-card {
            padding: 20px;
          }

          .result-reference {
            font-size: 16px;
          }

          .result-text {
            font-size: 15px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 1.4rem;
          }

          .hero-subtitle {
            font-size: 0.85rem;
          }

          .search-box {
            padding: 0 50px 0 45px;
            font-size: 15px;
          }

          .search-icon-left {
            left: 15px;
            width: 20px;
            height: 20px;
          }

          .search-button {
            width: 40px;
            height: 40px;
          }

          .search-icon {
            width: 18px;
            height: 18px;
          }
        }
      `}} />

      {/* Decorative Corners */}
      <div className="corner-decoration top-left"></div>
      <div className="corner-decoration top-right"></div>
      <div className="corner-decoration bottom-left"></div>
      <div className="corner-decoration bottom-right"></div>

      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <svg className="hero-cross" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12S21.1 14 20 14H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V14H4C2.9 14 2 13.1 2 12S2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
          </svg>
          
          <h1 className="hero-title">
            Tìm Lời Chúa cho tâm tư của bạn
          </h1>
          
          <p className="hero-subtitle">
            Gõ câu hỏi, cảm xúc, hoặc tình huống - chúng tôi sẽ tìm câu Kinh Thánh phù hợp
          </p>
        </section>

        {/* Search Section */}
        <section className="search-section">
          <form onSubmit={handleSearch}>
            <div className="search-box-container">
              <svg className="search-icon-left" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              
              <input
                type="text"
                className="search-box"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Khi tôi cô đơn... Làm sao vượt khó khăn... Tình yêu là gì..."
                disabled={loading}
              />
              
              <button
                type="submit"
                className="search-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  <svg className="search-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Error Message */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Results Section */}
        <section className={`results-section ${hasSearched ? 'show' : ''}`}>
          {results.length > 0 ? (
            <>
              <div className="results-header">
                Những câu này có thể giúp bạn:
              </div>
              
              <div>
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className="result-card animate"
                    onClick={() => handleResultClick(result)}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    
                    <div className="result-reference">
                      {result.payload.bookName} {result.payload.chapter}:
                      {result.payload.verseStart}
                      {result.payload.verseEnd !== result.payload.verseStart && 
                        `-${result.payload.verseEnd}`
                      }
                    </div>
                    
                    <div className="result-text">
                      {truncateText(result.payload.text)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : hasSearched && !loading ? (
            <div className="empty-state">
              Không tìm thấy kết quả phù hợp. Thử lại với từ khóa khác nhé!
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}