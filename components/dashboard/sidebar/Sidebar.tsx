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
}

export function Sidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
    pathname,
    expandedGroups,
    toggleGroup,
}: SidebarProps) {
    return (
        <div
            className={`
        ${isSidebarOpen ? "w-64 px-2" : "w-14"} 
        ${isMobile ? "fixed top-0 left-0 h-full z-50 bg-white transition-transform duration-300 ease-in-out" : "block"}
        ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}
        bg-white transition-all duration-300 ease-in-out 
        overflow-x-hidden
      `}
        >
            <SidebarToggle
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isMobile={isMobile}
            />
            <nav className="mt-6">
                {sidebarItems.map((item) =>
                    "items" in item ? (
                        <SidebarGroup
                            key={item.name}
                            group={item}
                            isSidebarOpen={isSidebarOpen}
                            expandedGroups={expandedGroups}
                            toggleGroup={toggleGroup}
                            pathname={pathname}
                        />
                    ) : (
                        <SidebarItem
                            key={item.name}
                            item={item}
                            isSidebarOpen={isSidebarOpen}
                            isActive={pathname === item.href}
                        />
                    )
                )}
            </nav>
        </div>
    );
}
