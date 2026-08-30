"use client";

import { SidebarToggle } from "./SidebarToggle";
import { SidebarItem } from "./SidebarItem";
import { SidebarGroup } from "./SidebarGroup";
import { sidebarItems } from "@/constant/sidebar/sidebar";

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isMobile: boolean;
    pathname: string;
    expandedGroups: Set<string>;
    toggleGroup: (groupName: string) => void;
    onNavigate?: () => void;
}

export function Sidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
    pathname,
    expandedGroups,
    toggleGroup,
    onNavigate,
}: SidebarProps) {
    return (
        <div
            className={`
        flex h-full min-h-0 flex-col overflow-x-hidden bg-white
        ${isMobile ? "w-full px-2" : isSidebarOpen ? "w-64 px-2" : "w-14"}
        transition-[width,padding] duration-300 ease-in-out
      `}
        >
            <SidebarToggle
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isMobile={isMobile}
            />
            <nav
                aria-label="Primary navigation"
                className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
                {sidebarItems.map((item) =>
                    "items" in item ? (
                        <SidebarGroup
                            key={item.name}
                            group={item}
                            isSidebarOpen={isSidebarOpen}
                            expandedGroups={expandedGroups}
                            toggleGroup={toggleGroup}
                            pathname={pathname}
                            onNavigate={onNavigate}
                        />
                    ) : (
                        <SidebarItem
                            key={item.name}
                            item={item}
                            isSidebarOpen={isSidebarOpen}
                            isActive={pathname === item.href}
                            onNavigate={onNavigate}
                        />
                    )
                )}
            </nav>
        </div>
    );
}
