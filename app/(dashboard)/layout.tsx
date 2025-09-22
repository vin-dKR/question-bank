"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import { useAuth, useUser } from "@clerk/nextjs";
import { sidebarItems } from "@/constant/sidebar/sidebar";
import { Sidebar } from "@/components/dashboard/sidebar/Sidebar";
import { Header } from "@/components/dashboard/content/Header"
import { MainContent } from "@/components/dashboard/content/MainContent";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useUser();
    const { signOut } = useAuth();
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sidebarOpen");
            return saved !== null ? JSON.parse(saved) : !isMobile;
        }
        return !isMobile;
    });

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
        }
    }, [isSidebarOpen]);

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
    }, [isMobile, isSidebarOpen])

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/auth/signup" });
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

    const activeItem = sidebarItems.find((item) => {
        if ("href" in item) {
            return pathname === item.href;
        } else {
            return item.items.some((subItem) => pathname === subItem.href);
        }
    });

    return (
        <div className="flex h-screen bg-gray-100 tracking-3">
            <div ref={sidebarRef} className="h-screen bg-white">
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
                <Header activeItem={activeItem} user={user} handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <MainContent>{children}</MainContent>
            </div>
        </div>
    );
}
