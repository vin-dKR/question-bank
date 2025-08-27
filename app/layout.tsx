import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: "Eduents",
    description: "Prepare questions for your Institute in sec.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js" async></script>
                <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
            </head>
            <body className={inter.variable}>
                <ClerkProvider>
                    <main className="min-h-screen bg-gray-50">
                        {children}
                    </main>
                    <Toaster closeButton={true} />
                </ClerkProvider>
            </body>
        </html>
    );
}
