"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarItem } from "./SidebarItem";

interface SidebarGroupProps {
    group: {
        name: string;
        icon: React.ReactNode;
        items: { name: string; href: string; icon: React.ReactNode; description?: string }[];
        description?: string;
    };
    isSidebarOpen: boolean;
    expandedGroups: Set<string>;
    toggleGroup: (groupName: string) => void;
    pathname: string;
}

export function SidebarGroup({ group, isSidebarOpen, expandedGroups, toggleGroup, pathname }: SidebarGroupProps) {
    const isRouteActive = (href: string) => {
        if (href === "/examination") {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };
    const hasActiveChild = group.items.some((item) => isRouteActive(item.href));
    const isExpanded = expandedGroups.has(group.name) || hasActiveChild;

    return (
        <div
            className={`
        flex truncate cursor-pointer text-sm
        ${isSidebarOpen ? "px-3 justify-start" : "justify-center px-0 items-center mx-2"}
        py-2 my-0.5 rounded-md transition-colors duration-150
        ${hasActiveChild
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}
        ${isSidebarOpen && isExpanded ? "flex-col" : ""}
      `}
        >
            <button
                onClick={() => toggleGroup(group.name)}
                className={`
          flex items-center w-full cursor-pointer
          ${isSidebarOpen ? "px-0 justify-between" : "items-center justify-center"}
        `}
                title={!isSidebarOpen ? group.name : ""}
            >
                <div className="flex items-center">
                    <div className="flex-shrink-0">{group.icon}</div>
                    {isSidebarOpen && <span className="ml-3 text-sm">{group.name}</span>}
                </div>
                {isSidebarOpen &&
                    (isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    ))}
            </button>
            {isExpanded && isSidebarOpen && (
                <div className="flex flex-col mt-1">
                    {group.items.map((item) => (
                        <SidebarItem
                            key={item.name}
                            item={item}
                            isSidebarOpen={isSidebarOpen}
                            isSubItem={true}
                            isActive={isRouteActive(item.href)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
