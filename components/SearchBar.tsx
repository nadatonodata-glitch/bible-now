// components/SearchBar.tsx
'use client';

import { useState } from 'react';

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

interface SearchBarProps {
  onSelectChapter: (bookCode: string, chapter: number, bookName: string) => void;
}

export default function SearchBar({ onSelectChapter }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }
    
    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });
      
      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi tìm kiếm');
      }
      
      const data = await response.json();
      setResults(data.results);
      setShowResults(true);
      
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onSelectChapter(
      result.payload.bookCode,
      result.payload.chapter,
      result.payload.bookName
    );
    setShowResults(false);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    // Loại bỏ số câu ở đầu (VD: ¹²³)
    const cleanText = text.replace(/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, '');
    
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .search-container {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 600px;
          z-index: 100;
        }

        .search-box {
          background: linear-gradient(135deg, #FEF9E7 0%, #F5E6D3 100%);
          border: 3px solid #CD7F32;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .search-form {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px 12px 44px;
          border: 2px solid #CD7F32;
          border-radius: 8px;
          font-family: 'Noto Serif', serif;
          font-size: 15px;
          background: #FEF9E7;
          color: #654321;
          transition: all 0.3s ease;
          position: relative;
        }

        .search-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          fill: #CD7F32;
          pointer-events: none;
        }

        .search-button {
          padding: 12px 24px;
          border: 2px solid #D4AF37;
          border-radius: 8px;
          background: #D4AF37;
          color: #FEF9E7;
          font-family: 'Noto Serif', serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .search-button:hover:not(:disabled) {
          background: #C19B2E;
          border-color: #C19B2E;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #FEF9E7;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .results-container {
          max-height: 400px;
          overflow-y: auto;
          margin-top: 8px;
        }

        .result-item {
          background: #FEF9E7;
          border: 2px solid #CD7F32;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .result-item:hover {
          background: #F9F0DC;
          border-color: #D4AF37;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .result-reference {
          font-weight: 700;
          color: #654321;
          font-size: 14px;
        }

        .result-score {
          font-size: 12px;
          color: #8B4513;
          background: rgba(212, 175, 55, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .result-text {
          color: #654321;
          font-size: 14px;
          line-height: 1.6;
        }

        .error-message {
          color: #8B0000;
          background: rgba(220, 20, 60, 0.1);
          border: 2px solid rgba(220, 20, 60, 0.3);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          color: #8B4513;
          padding: 20px;
          font-style: italic;
        }

        .results-container::-webkit-scrollbar {
          width: 8px;
        }

        .results-container::-webkit-scrollbar-track {
          background: #F5E6D3;
          border-radius: 4px;
        }

        .results-container::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .search-container {
            width: 95%;
            top: 10px;
          }
          
          .search-form {
            flex-direction: column;
          }
          
          .search-button {
            width: 100%;
          }
        }
      `}} />

      <div className="search-container">
        <div className="search-box">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm trong Kinh Thánh..."
                className="search-input"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="search-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner" />
              ) : (
                'Tìm kiếm'
              )}
            </button>
          </form>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {showResults && !loading && !error && (
            <div className="results-container">
              {results.length === 0 ? (
                <div className="empty-state">
                  Không tìm thấy kết quả phù hợp
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="result-item"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="result-header">
                      <div className="result-reference">
                        {result.payload.bookName} {result.payload.chapter}:
                        {result.payload.verseStart}
                        {result.payload.verseEnd !== result.payload.verseStart && 
                          `-${result.payload.verseEnd}`
                        }
                      </div>
                      <div className="result-score">
                        {Math.round(result.score * 100)}%
                      </div>
                    </div>
                    <div className="result-text">
                      {truncateText(result.payload.text)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}