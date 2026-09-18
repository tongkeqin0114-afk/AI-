import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "AI 视频创作", description: "从灵感到短视频成片" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}