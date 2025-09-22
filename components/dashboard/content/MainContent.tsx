"use client";

import { CollaborationProvider } from "@/lib/context/CollaborationContext";
import AppProviders from "@/components/providers/AppProviders";

interface MainContentProps {
    children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
    return (
        <main className="relative flex-1 overflow-y-auto p-6">
            <AppProviders>
                <CollaborationProvider>{children}</CollaborationProvider>
            </AppProviders>
        </main>
    );
}
