// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bible Now - Tìm Kiếm Lời Chúa Cho Bạn',
  description: 'Tìm kiếm Lời Chúa cho bạn - Kinh Thánh Tiếng Việt bản 1934 với công nghệ tìm kiếm thông minh',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/android-chrome-512x512.png',
      }
    ]
  },
  openGraph: {
    title: 'Bible Now - Tìm Kiếm Lời Chúa Cho Bạn',
    description: 'Tìm kiếm Lời Chúa cho bạn - Công cụ tìm kiếm Kinh Thánh thông minh',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Bible Now - Tìm Kiếm Lời Chúa Cho Bạn'
    }],
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Bible Now'
  },
  keywords: ['Kinh Thánh', 'Bible', 'Kinh Thánh Việt Nam', 'Lời Chúa', 'Tìm kiếm Kinh Thánh', 'Bible search'],
  authors: [{ name: 'Bible Now' }],
  creator: 'Bible Now',
  publisher: 'Bible Now'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}