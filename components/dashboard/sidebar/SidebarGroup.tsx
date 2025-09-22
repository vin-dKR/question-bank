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
    const isExpanded = expandedGroups.has(group.name);
    const hasActiveChild = group.items.some((item) => pathname === item.href);

    return (
        <div
            className={`
        flex truncate cursor-pointer
        ${isSidebarOpen ? "px-4 justify-start" : "justify-center px-0 items-center mx-2"}
        py-2 my-1 rounded-lg 
        ${hasActiveChild ? "bg-gray-200 font-semibold text-gray-900" : "hover:bg-gray-100"}
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
                            isActive={pathname === item.href}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
