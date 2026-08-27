"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, LogOut, Settings, User as UserIcon, ChevronRight } from "lucide-react";
import type { CurrentUser } from "@/hooks/auth/useCurrentUser";
import { HamburgerMenu } from "@/components/dashboard/sidebar/HamburgerMenu";
import { Dispatch, SetStateAction } from "react";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { OrgSwitcher, type SwitcherOrg } from "@/components/organization/OrgSwitcher";

interface HeaderProps {
    activeItem: SidebarItem | SidebarGroup | undefined;
    user: CurrentUser | null | undefined;
    /** Organizations this person belongs to, resolved server-side. */
    orgs: SwitcherOrg[];
    handleLogout: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
    isMobile: boolean;
}

function getPlatformKey() {
    if (typeof navigator === "undefined") return { symbol: "Ctrl", isMac: false };
    const isMac = /mac/i.test(navigator.platform) || /mac/i.test(navigator.userAgent);
    return { symbol: isMac ? "⌘" : "Ctrl", isMac };
}

export function Header({
    activeItem,
    user,
    orgs,
    handleLogout,
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
}: HeaderProps) {
    const router = useRouter();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [keyHint, setKeyHint] = useState("Ctrl");

    useEffect(() => {
        setKeyHint(getPlatformKey().symbol);
    }, []);

    // Global Ctrl/Cmd+K shortcut
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const pageName = activeItem
        ? "href" in activeItem
            ? activeItem.name
            : activeItem.name
        : "Dashboard";
    const pageDescription = activeItem
        ? "href" in activeItem
            ? activeItem.description
            : activeItem.description
        : undefined;

    const displayName = user?.fullName || "User";
    const displayEmail = user?.email;
    const initials =
        displayName
            .split(" ")
            .slice(0, 2)
            .map((part: string) => part[0]?.toUpperCase())
            .join("") || "U";

    return (
        <>
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="flex items-center gap-3 px-4 py-2.5 md:px-6 md:py-3">
                    {/* Left: institution + breadcrumb */}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        {isMobile && !isSidebarOpen && <HamburgerMenu setIsSidebarOpen={setIsSidebarOpen} />}

                        {/*
                          * This was the hardcoded word "Workspace" — accurate
                          * only while nobody could belong to two institutions.
                          * Every folder, paper and class below it belongs to
                          * exactly one, and nothing on screen said which.
                          *
                          * It renders as a real control, not breadcrumb text,
                          * and it renders even for someone with a single
                          * organization: it is also the only route to creating
                          * a second one.
                          */}
                        {orgs.length > 0 ? (
                            <OrgSwitcher orgs={orgs} />
                        ) : (
                            <span className="text-[13px] font-medium text-zinc-500">
                                Workspace
                            </span>
                        )}

                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-300" />

                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-zinc-900">
                                {pageName}
                            </p>
                            {pageDescription && (
                                <p className="hidden truncate text-xs text-zinc-500 sm:block">
                                    {pageDescription}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Center: command trigger */}
                    <button
                        type="button"
                        onClick={() => setPaletteOpen(true)}
                        className="hidden md:inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-black/5 bg-zinc-50 hover:bg-zinc-100 text-xs text-zinc-500 transition-colors min-w-[220px] cursor-pointer"
                        aria-label="Search"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span className="flex-1 text-left">Search...</span>
                        <kbd className="inline-flex items-center gap-0.5 rounded border border-black/5 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                            {keyHint}K
                        </kbd>
                    </button>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPaletteOpen(true)}
                            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
                        </button>

                        <div className="h-5 w-px bg-black/5 mx-1" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 h-8 pl-0.5 pr-2 rounded-lg hover:bg-zinc-50 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                                    aria-label="Account"
                                >
                                    <Avatar className="h-7 w-7 ring-2 ring-white shadow-xs">
                                        <AvatarImage src={user?.imageUrl} alt={displayName} />
                                        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden lg:block text-xs font-medium text-zinc-700 group-hover:text-zinc-900 max-w-[120px] truncate">
                                        {displayName}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-60 border-black/5 shadow-lg p-1.5"
                            >
                                <DropdownMenuLabel className="font-normal px-2 py-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user?.imageUrl} alt={displayName} />
                                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-zinc-900 truncate">{displayName}</p>
                                            {displayEmail && (
                                                <p className="text-xs text-zinc-500 truncate">{displayEmail}</p>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/profile")}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </>
    );
}
