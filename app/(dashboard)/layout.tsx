"use client";

import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "react-responsive";
import { useAuth, useUser } from "@clerk/nextjs";
import { sidebarItems } from "@/constant/sidebar/sidebar";
import { LogOut, Menu, ChevronDown, ChevronRight } from "lucide-react";
import { CollaborationProvider } from "@/lib/context/CollaborationContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useUser();
    const { signOut } = useAuth();
    const isMobile = useMediaQuery({ maxWidth: 768 });

    // Initialize sidebar state from localStorage, default to closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sidebarOpen");
            return saved !== null ? JSON.parse(saved) : !isMobile;
        }
        return !isMobile;
    });

    // State for expanded groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Save sidebar state to localStorage when it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
        }
    }, [isSidebarOpen]);

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/auth/signup" });
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) {
                newSet.delete(groupName);
            } else {
                newSet.add(groupName);
            }
            return newSet;
        });
    };

    // Determine the active item based on the current pathname
    const activeItem = sidebarItems.find((item) => {
        if ('href' in item) {
            return pathname === item.href;
        } else {
            return item.items.some(subItem => pathname === subItem.href);
        }
    });

    const renderSidebarItem = (item: SidebarItem, isSubItem = false) => {
        const isActive = pathname === item.href;

        return (
            <Link
                key={item.name}
                href={item.href}
                className={`
                    flex items-center truncate
                    ${isSidebarOpen ? "px-4 justify-start" : "justify-center"}
                    py-2 my-1 rounded-lg
                    text-gray-700 transition
                    ${isActive ? "bg-gray-100 font-semibold text-gray-900" : ""}
                    ${isSubItem ? "pl-3" : ""}
              `}
                title={!isSidebarOpen ? item.name : ""}
            >
                <div className="flex-shrink-0">{item.icon}</div>

                {isSidebarOpen && (
                    <span className="ml-3 text-sm truncate">{item.name}</span>
                )}
            </Link>
        );
    };


    const renderSidebarGroup = (group: SidebarGroup) => {
        const isExpanded = expandedGroups.has(group.name);
        const hasActiveChild = group.items.some(item => pathname === item.href);

        return (
            <div
                key={group.name}
                className={`
                    flex truncate cursor-pointer
                    ${isSidebarOpen ? "px-4 justify-start" : "justify-center"}
                    py-2 my-1 rounded-lg 
                    ${hasActiveChild ? "bg-gray-200 font-semibold text-gray-900" : "hover:bg-gray-100"}
                    ${isSidebarOpen && isExpanded ? "flex-col" : ""}
                `}>
                <button
                    onClick={() => toggleGroup(group.name)}
                    className={`
                        flex items-center w-full cursor-pointer
                        ${isSidebarOpen ? "px-0 justify-between" : ""}
                    `}
                    title={!isSidebarOpen ? group.name : ""}
                >
                    <div className="flex items-center">
                        <div className="flex-shrink-0">{group.icon}</div>
                        {isSidebarOpen && <span className="ml-3 text-sm">{group.name}</span>}
                    </div>

                    {/* Chevron stays far right without expanding width */}
                    {isSidebarOpen &&
                        (isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        ))}
                </button>

                {isExpanded && isSidebarOpen && (
                    <div className="flex flex-col mt-1">
                        {group.items.map(item => renderSidebarItem(item, true))}
                    </div>
                )}
            </div>
        );
    };




    return (
        <div className="flex h-screen bg-gray-100 tracking-3">
            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? "w-64 px-2" : "w-14"} 
                    bg-white shadow-lg transition-all duration-300 ease-in-out 
                    overflow-x-hidden`
                }>
                <div className="flex items-center mt-4">
                    <Button
                        variant="ghost"
                        className={`w-full ${isSidebarOpen ? "justify-between px-2" : "justify-center"}`}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        aria-expanded={isSidebarOpen}
                    >
                        {isSidebarOpen && (
                            <div>
                                <video
                                    src="/output.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="auto"
                                    width={60}
                                    height={60}
                                />
                            </div>
                        )}
                        <Menu className="h-8 w-8 text-black" />
                    </Button>
                </div>

                <nav className="mt-6">
                    {sidebarItems.map((item) => {
                        if ("items" in item) {
                            return renderSidebarGroup(item);
                        } else {
                            return renderSidebarItem(item);
                        }
                    })}
                </nav>
            </div>


            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="border-b border-black/10 p-4 flex justify-between items-center">
                    <div className="flex flex-col items-start space-x-4">
                        <h1 className="text-xl font-semibold">
                            {activeItem ? ('href' in activeItem ? activeItem.name : activeItem.name) : "Dashboard"}
                        </h1>
                        {activeItem && (
                            <p className="text-gray-600/60 text-sm">
                                {'href' in activeItem ? activeItem.description : activeItem.description}
                            </p>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.imageUrl} alt="User" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                {isSidebarOpen && <span>{user?.fullName || "User"}</span>}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                LogOut
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <CollaborationProvider>{children}</CollaborationProvider>
                </main>
            </div>
        </div>
    );
}
