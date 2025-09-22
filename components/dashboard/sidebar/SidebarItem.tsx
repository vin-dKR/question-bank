"use client";

import Link from "next/link";

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
}

export function SidebarItem({ item, isSidebarOpen, isSubItem = false, isActive }: SidebarItemProps) {
    return (
        <Link
            href={item.href}
            className={`
        flex items-center truncate
        ${isSidebarOpen ? "px-4 justify-start" : "justify-center mx-2"}
        py-2 my-1 rounded-lg
        text-gray-700 transition
        ${isActive ? "bg-gray-100 font-semibold text-gray-900" : ""}
        ${isSubItem ? "pl-8" : ""}
      `}
            title={!isSidebarOpen ? item.name : ""}
        >
            <div className="flex-shrink-0">{item.icon}</div>
            {isSidebarOpen && <span className="ml-3 text-sm truncate">{item.name}</span>}
        </Link>
    );
}
