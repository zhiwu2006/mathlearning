import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '数学分步引导练习系统',
  description: '基于认知科学的数学应用题分步引导学习平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}