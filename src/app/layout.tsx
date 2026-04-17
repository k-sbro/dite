import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '식단 기록',
  description: 'AI로 식사 사진을 분석해 칼로리를 기록하는 앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
