"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { sidebarItems } from "@/constant/sidebar/sidebar";
import { Sidebar } from "@/components/dashboard/sidebar/Sidebar";
import { SidebarSheet } from "@/components/dashboard/sidebar/SidebarSheet";
import { Header } from "@/components/dashboard/content/Header";
import type { SwitcherOrg } from "@/components/organization/OrgSwitcher";
import { SHELL_COMPACT_MEDIA_QUERY } from "@/lib/responsive";

export function DashboardLayoutClient({
    children,
    orgs = [],
}: {
    children: React.ReactNode;
    /** Resolved server-side in the layout — see AuthContext.memberships. */
    orgs?: SwitcherOrg[];
}) {
    const pathname = usePathname();
    const { user, signOut } = useCurrentUser();
    const isCompact = useMediaQuery({ query: SHELL_COMPACT_MEDIA_QUERY });

    /**
     * HYDRATION. This state is deliberately seeded with a CONSTANT, and the real
     * value applied after mount.
     *
     * It used to read `localStorage` and the viewport mode in the initialiser, both of
     * which are unavailable or different on the server: the server rendered the
     * sidebar open, the browser rendered it however the user last left it, and
     * React threw #418 ("hydration failed — the initial UI does not match what
     * was rendered on the server") and discarded the server tree.
     *
     * The compact drawer has separate, closed-by-default state. This stored
     * preference now controls only the persistent desktop sidebar.
     *
     * The cost is one frame with the sidebar open on a phone. The alternative is
     * a hydration failure on every single page load, which also throws away the
     * server-rendered HTML and re-renders the whole tree on the client.
     */
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Apply the stored preference once, after the first client render.
    useEffect(() => {
        let restored: boolean | null = null;
        try {
            const saved = localStorage.getItem("sidebarOpen");
            if (saved !== null) restored = JSON.parse(saved) as boolean;
        } catch {
            // Private mode, blocked storage, or a corrupt value. Fall through to
            // the viewport default rather than leaving the sidebar stuck open.
        }
        setIsSidebarOpen(restored ?? true);
        setHydrated(true);
    }, []);

    useEffect(() => {
        // Don't write until the stored value has been read, or the constant
        // seeded above would overwrite the user's real preference on first load.
        if (!hydrated) return;
        try {
            localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
        } catch {
            // Non-fatal — the sidebar just won't be remembered on this device.
        }
    }, [isSidebarOpen, hydrated]);

    // A completed client navigation always dismisses the compact drawer. Link
    // activation also closes it immediately; this effect covers every other
    // route-change source (browser history, command palette, redirects).
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [pathname]);

    // Crossing into desktop mode must not leave a logically-open modal behind.
    useEffect(() => {
        if (!isCompact) setIsDrawerOpen(false);
    }, [isCompact]);

    const handleLogout = async () => {
        // Absolute URL — see the note in components/Signout.tsx. A relative
        // path makes WorkOS fall back to the app homepage URL and fail logout.
        await signOut({ returnTo: `${window.location.origin}/auth/signup` });
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) {
                newSet.delete(groupName);
            } else {
                newSet.add(groupName);
            }
            return newSet;
        });
    };

    const isRouteActive = (href: string) => {
        if (href === "/examination") {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const activeItem = sidebarItems.find((item) => {
        if ("href" in item) {
            return isRouteActive(item.href);
        } else {
            return item.items.some((subItem) => isRouteActive(subItem.href));
        }
    });

    return (
        <DialogPrimitive.Root
            modal
            open={isCompact && isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
        >
            <div className="app-shell flex overflow-hidden bg-zinc-50 tracking-3">
                {!isCompact && (
                    <aside className="h-full shrink-0 border-r border-black/5 bg-white">
                        <Sidebar
                            isSidebarOpen={isSidebarOpen}
                            setIsSidebarOpen={setIsSidebarOpen}
                            isMobile={false}
                            pathname={pathname}
                            expandedGroups={expandedGroups}
                            toggleGroup={toggleGroup}
                        />
                    </aside>
                )}

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <Header
                        activeItem={activeItem}
                        user={user}
                        orgs={orgs}
                        handleLogout={handleLogout}
                        isCompact={isCompact}
                    />
                    {children}
                </div>

                {isCompact && (
                    <SidebarSheet>
                        <Sidebar
                            isSidebarOpen
                            setIsSidebarOpen={setIsDrawerOpen}
                            isMobile
                            pathname={pathname}
                            expandedGroups={expandedGroups}
                            toggleGroup={toggleGroup}
                            onNavigate={() => setIsDrawerOpen(false)}
                        />
                    </SidebarSheet>
                )}
            </div>
        </DialogPrimitive.Root>
    );
}
