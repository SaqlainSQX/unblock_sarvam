import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Unblock · Kivi workshop', description: 'Ask once. Help everyone move forward.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
