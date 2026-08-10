import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import WebVitalsReporter from "@/components/perf/WebVitalsReporter";
import { QueryProvider } from "@/provider/QueryProvider";

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
            <body className={inter.variable}>
                <ClerkProvider signInUrl="/auth/signin" signUpUrl="/auth/signup">
                    <QueryProvider>
                        <main className="min-h-screen bg-gray-50">
                            {children}
                        </main>
                        <Toaster closeButton={true} />
                        <WebVitalsReporter />
                    </QueryProvider>
                </ClerkProvider>
            </body>
        </html>
    );
}
