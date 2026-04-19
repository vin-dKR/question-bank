"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent } from "react";

interface SidebarItemProps {
    item: {
        name: string;
        href: string;
        icon: React.ReactNode;
        description?: string;
    };
    isSidebarOpen: boolean;
    isSubItem?: boolean;
    isActive: boolean;
}

export function SidebarItem({ item, isSidebarOpen, isSubItem = false, isActive }: SidebarItemProps) {
    const router = useRouter();
    // Phase 2: wrap nav in useTransition so the click is never "stuck" behind
    // the current route's pending work. Combined with per-segment loading.tsx
    // (Phase 1), the new route's shell paints immediately.
    const [isPending, startTransition] = useTransition();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        // Allow middle-click / cmd+click / ctrl+click to fall through to the
        // default <Link> behaviour (new tab / window). Only intercept a plain
        // left-click for the transition wrapper.
        if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
        ) {
            return;
        }
        e.preventDefault();
        startTransition(() => {
            router.push(item.href);
        });
    };

    return (
        <Link
            href={item.href}
            onClick={handleClick}
            className={`
        flex items-center truncate
        ${isSidebarOpen ? "px-4 justify-start" : "justify-center mx-2"}
        py-2 my-1 rounded-lg
        text-gray-700 transition
        ${isActive ? "bg-gray-100 font-semibold text-gray-900" : ""}
        ${isSubItem ? "pl-8" : ""}
        ${isPending ? "opacity-60" : ""}
      `}
            title={!isSidebarOpen ? item.name : ""}
            aria-busy={isPending || undefined}
        >
            <div className="flex-shrink-0 relative">
                {item.icon}
                {isPending && (
                    <span
                        className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-gray-400 border-t-transparent animate-spin"
                        aria-hidden="true"
                    />
                )}
            </div>
            {isSidebarOpen && <span className="ml-3 text-sm truncate">{item.name}</span>}
        </Link>
    );
}
