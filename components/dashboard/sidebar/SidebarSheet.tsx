"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

export function SidebarSheet({ children }: { children: React.ReactNode }) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
                id="mobile-navigation"
                aria-describedby={undefined}
                aria-modal="true"
                className="fixed inset-y-0 left-0 z-50 h-[100dvh] max-h-[100dvh] w-[min(16rem,calc(100vw-1rem))] overflow-hidden bg-white shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
            >
                <DialogPrimitive.Title className="sr-only">Main navigation</DialogPrimitive.Title>
                {children}
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}
