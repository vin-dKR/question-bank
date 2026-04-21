"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { sidebarItems } from "@/constant/sidebar/sidebar";
import { Search, Clock, ArrowUpRight, Command as CmdIcon, FilePlus, User as UserIcon, Settings as SettingsIcon } from "lucide-react";

type PaletteEntry = {
    name: string;
    description?: string;
    href: string;
    icon: React.ReactNode;
    category: "page" | "action";
};

const STORAGE_KEY = "eduents:recent-routes";
const MAX_RECENT = 5;

function flattenSidebar(): PaletteEntry[] {
    const flat: PaletteEntry[] = [];
    for (const item of sidebarItems) {
        if ("items" in item) {
            for (const sub of item.items) {
                flat.push({
                    name: sub.name,
                    description: sub.description,
                    href: sub.href,
                    icon: sub.icon,
                    category: "page",
                });
            }
        } else {
            flat.push({
                name: item.name,
                description: item.description,
                href: item.href,
                icon: item.icon,
                category: "page",
            });
        }
    }
    return flat;
}

const QUICK_ACTIONS: PaletteEntry[] = [
    {
        name: "New Question",
        description: "Add a question to your bank",
        href: "/post",
        icon: <FilePlus className="h-4 w-4" />,
        category: "action",
    },
    {
        name: "Create Test",
        description: "Build a new exam",
        href: "/examination/create",
        icon: <FilePlus className="h-4 w-4" />,
        category: "action",
    },
];

const ACCOUNT_ENTRIES: PaletteEntry[] = [
    {
        name: "Profile",
        description: "View your account details",
        href: "/profile",
        icon: <UserIcon className="h-4 w-4" />,
        category: "page",
    },
    {
        name: "Settings",
        description: "Manage preferences",
        href: "/settings",
        icon: <SettingsIcon className="h-4 w-4" />,
        category: "page",
    },
];

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const pages = useMemo(() => flattenSidebar(), []);
    const allEntries = useMemo(
        () => [...pages, ...ACCOUNT_ENTRIES, ...QUICK_ACTIONS],
        [pages],
    );

    // Load recents when dialog opens
    useEffect(() => {
        if (!open) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setRecentHrefs(JSON.parse(raw));
        } catch {}
        setQuery("");
        setActiveIdx(0);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    // Track current route as visited (once per pathname)
    useEffect(() => {
        if (!pathname) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list: string[] = raw ? JSON.parse(raw) : [];
            const next = [pathname, ...list.filter((p) => p !== pathname)].slice(0, MAX_RECENT);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
    }, [pathname]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return null;
        return allEntries.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                (e.description ?? "").toLowerCase().includes(q),
        );
    }, [query, allEntries]);

    const recents = useMemo(() => {
        const map = new Map(allEntries.map((e) => [e.href, e]));
        return recentHrefs
            .filter((h) => h !== pathname && map.has(h))
            .map((h) => map.get(h)!)
            .slice(0, MAX_RECENT);
    }, [recentHrefs, allEntries, pathname]);

    // Flattened list for keyboard nav
    const sections = useMemo(() => {
        if (filtered) {
            return [{ label: `Results (${filtered.length})`, items: filtered }];
        }
        const out: { label: string; items: PaletteEntry[] }[] = [];
        if (recents.length) out.push({ label: "Recent", items: recents });
        out.push({ label: "Pages", items: pages });
        out.push({ label: "Quick actions", items: QUICK_ACTIONS });
        out.push({ label: "Account", items: ACCOUNT_ENTRIES });
        return out;
    }, [filtered, recents, pages]);

    const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

    useEffect(() => {
        setActiveIdx(0);
    }, [query]);

    const go = useCallback(
        (entry: PaletteEntry) => {
            router.push(entry.href);
            onOpenChange(false);
        },
        [router, onOpenChange],
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const entry = flatItems[activeIdx];
            if (entry) go(entry);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Command Palette</DialogTitle>
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
                    <Search className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search pages, actions..."
                        className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
                    />
                    <kbd className="hidden sm:inline-flex items-center rounded border border-black/5 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[360px] overflow-y-auto p-1">
                    {sections.length === 0 || flatItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-zinc-500">
                            No results for &quot;{query}&quot;
                        </div>
                    ) : (
                        sections.map((section, si) => {
                            const sectionStart = sections
                                .slice(0, si)
                                .reduce((sum, s) => sum + s.items.length, 0);
                            return (
                                <div key={section.label} className={si > 0 ? "mt-1" : ""}>
                                    <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-zinc-400 font-medium">
                                        {section.label === "Recent" && <Clock className="h-2.5 w-2.5" />}
                                        {section.label}
                                    </div>
                                    <ul>
                                        {section.items.map((entry, i) => {
                                            const globalIdx = sectionStart + i;
                                            const isActive = globalIdx === activeIdx;
                                            return (
                                                <li key={`${entry.href}-${entry.name}-${i}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => go(entry)}
                                                        onMouseEnter={() => setActiveIdx(globalIdx)}
                                                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                                                            isActive
                                                                ? "bg-indigo-50 text-indigo-900"
                                                                : "text-zinc-700 hover:bg-zinc-50"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${
                                                                isActive
                                                                    ? "bg-indigo-100 text-indigo-700"
                                                                    : "bg-zinc-100 text-zinc-500"
                                                            }`}
                                                        >
                                                            {entry.icon}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium truncate">{entry.name}</p>
                                                            {entry.description && (
                                                                <p className="text-[11px] text-zinc-500 truncate">{entry.description}</p>
                                                            )}
                                                        </div>
                                                        {isActive && (
                                                            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer hints */}
                <div className="flex items-center justify-between border-t border-black/5 bg-zinc-50/60 px-4 py-2 text-[11px] text-zinc-500">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                            <kbd className="inline-flex items-center rounded border border-black/5 bg-white px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                            open
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <kbd className="inline-flex items-center rounded border border-black/5 bg-white px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                            navigate
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                        <CmdIcon className="h-3 w-3" />
                        <span className="font-medium">Quick search</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
