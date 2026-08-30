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
    onNavigate?: () => void;
}

export function SidebarItem({ item, isSidebarOpen, isSubItem = false, isActive, onNavigate }: SidebarItemProps) {
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
        onNavigate?.();
        startTransition(() => {
            router.push(item.href);
        });
    };

    return (
        <Link
            href={item.href}
            onClick={handleClick}
            className={`
        flex items-center truncate relative
        ${isSidebarOpen ? "px-3 justify-start" : "justify-center mx-2"}
        py-2 my-0.5 rounded-md text-sm
        transition-colors duration-150
        ${isActive
                    ? isSubItem
                        ? "bg-white text-indigo-700 font-medium shadow-xs"
                        : "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-zinc-600 hover:bg-indigo-500/20 hover:text-zinc-900"}
        ${isSubItem ? "pl-4" : ""}
        ${isPending ? "opacity-60" : ""}
      `}
            title={!isSidebarOpen ? item.name : ""}
            aria-busy={isPending || undefined}
            aria-current={isActive ? "page" : undefined}
        >
            {isActive && isSidebarOpen && (
                <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-indigo-600"
                />
            )}
            <div className="flex-shrink-0">{item.icon}</div>
            {isSidebarOpen && <span className="ml-3 text-sm truncate">{item.name}</span>}
        </Link>
    );
}
