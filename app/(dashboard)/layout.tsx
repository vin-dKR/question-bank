"use client";

import { BarChart, Book, Home, Layers, LogOut, Menu, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { CollaborationProvider } from "@/lib/context/CollaborationContext";
import Link from "next/link";

interface SidebarItem {
    name: string;
    description: string;
    href: string;
    icon: React.ReactElement;
}

const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", description: "View overview and metrics", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Questions", description: "Select questions to Print", href: "/questions", icon: <Book className="h-5 w-5" /> },
    { name: "Paper History", description: "Organize question categories", href: "/history", icon: <Layers className="h-5 w-5" /> },
    { name: "Drats Questions", description: "Analyze performance data", href: "/drafts", icon: <BarChart className="h-5 w-5" /> },
    { name: "Question Templates", description: "Configure account settings", href: "/templates", icon: <Settings className="h-5 w-5" /> },
];

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

    // Save sidebar state to localStorage when it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
        }
    }, [isSidebarOpen]);

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/auth/signup" });
    };

    // Determine the active item based on the current pathname
    const activeItem = sidebarItems.find((item) => pathname === item.href);

    return (
        <div className="flex h-screen bg-gray-100 tracking-3">
            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? "w-64 px-2" : "w-14"} bg-white shadow-lg transition-all duration-300 ease-in-out`}
            >
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
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center py-2 text-gray-700 hover:bg-gray-200 transition-colors duration-200 my-1 mx-2 rounded rounded-lg 
                ${isSidebarOpen ? "px-4" : "justify-center"} 
                ${pathname === item.href ? "bg-gray-200 font-bold" : ""}`}
                            title={!isSidebarOpen ? item.name : ""}
                        >
                            <div className="flex-shrink-0">{item.icon}</div>
                            {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="border-b border-black/10 p-4 flex justify-between items-center">
                    <div className="flex flex-col items-start space-x-4">
                        <h1 className="text-xl font-semibold">
                            {activeItem ? activeItem.name : "Dashboard"}
                        </h1>
                        {activeItem && (
                            <p className="text-gray-600/60 text-sm">{activeItem.description}</p>
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
