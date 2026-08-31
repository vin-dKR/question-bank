"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { sidebarItems } from "@/constant/sidebar/sidebar";
import { Sidebar } from "@/components/dashboard/sidebar/Sidebar";
import { Header } from "@/components/dashboard/content/Header";
import type { SwitcherOrg } from "@/components/organization/OrgSwitcher";

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
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const sidebarRef = useRef<HTMLDivElement>(null);

    /**
     * HYDRATION. This state is deliberately seeded with a CONSTANT, and the real
     * value applied after mount.
     *
     * It used to read `localStorage` and `isMobile` in the initialiser, both of
     * which are unavailable or different on the server: the server rendered the
     * sidebar open, the browser rendered it however the user last left it, and
     * React threw #418 ("hydration failed — the initial UI does not match what
     * was rendered on the server") and discarded the server tree.
     *
     * `useMediaQuery` is the same hazard — there is no viewport during SSR, so
     * it reports desktop on the server and the truth on the client.
     *
     * The cost is one frame with the sidebar open on a phone. The alternative is
     * a hydration failure on every single page load, which also throws away the
     * server-rendered HTML and re-renders the whole tree on the client.
     */
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
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
        setIsSidebarOpen(restored ?? !isMobile);
        setHydrated(true);
        // Runs once: `isMobile` is read for the initial default only. Later
        // viewport changes are the user's business, not ours to override.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMobile &&
                isSidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMobile, isSidebarOpen]);

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
        <div className="flex h-screen bg-zinc-50 tracking-3">
            <div ref={sidebarRef} className="h-screen bg-white border-r border-black/5">
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isMobile={isMobile}
                    pathname={pathname}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header activeItem={activeItem} user={user} orgs={orgs} handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isMobile={isMobile} />
                {children}
            </div>
        </div>
    );
}
