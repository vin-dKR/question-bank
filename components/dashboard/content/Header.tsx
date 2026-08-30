"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { OrgSwitcher, type SwitcherOrg } from "@/components/organization/OrgSwitcher";

interface HeaderProps {
    activeItem: SidebarItem | SidebarGroup | undefined;
    user: CurrentUser | null | undefined;
    /** Organizations this person belongs to, resolved server-side. */
    orgs: SwitcherOrg[];
    handleLogout: () => void;
    isCompact: boolean;
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
    isCompact,
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
            <header className="sticky top-0 z-30 shrink-0 border-b border-black/5 bg-white/85 backdrop-blur-md">
                <div className="shell-gutters flex min-w-0 items-center gap-1 py-2.5 sm:gap-2 lg:py-3">
                    {/* Left: institution + breadcrumb */}
                    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                        {isCompact && <HamburgerMenu />}

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
                            <span className="hidden truncate text-[13px] font-medium text-zinc-500 sm:block">
                                Workspace
                            </span>
                        )}

                        <ChevronRight className="hidden h-3.5 w-3.5 flex-shrink-0 text-zinc-300 sm:block" />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-zinc-900" title={pageName}>
                                {pageName}
                            </p>
                            {pageDescription && (
                                <p className="hidden truncate text-xs text-zinc-500 lg:block">
                                    {pageDescription}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Center: command trigger */}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPaletteOpen(true)}
                        className="hidden h-9 min-w-[200px] max-w-[260px] items-center gap-2 rounded-lg border border-black/5 bg-zinc-50 px-3 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 xl:inline-flex"
                        aria-label="Search"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span className="flex-1 text-left">Search...</span>
                        <kbd className="inline-flex items-center gap-0.5 rounded border border-black/5 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                            {keyHint}K
                        </kbd>
                    </Button>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setPaletteOpen(true)}
                            className="hidden h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:inline-flex xl:hidden"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:inline-flex"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
                        </Button>

                        <div className="mx-1 hidden h-5 w-px bg-black/5 sm:block" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="group flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 sm:justify-start sm:pr-2"
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
                                </Button>
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
                                <DropdownMenuItem
                                    className="sm:hidden"
                                    onClick={() => setPaletteOpen(true)}
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </DropdownMenuItem>
                                <DropdownMenuItem className="sm:hidden" disabled>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Notifications
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="sm:hidden" />
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
