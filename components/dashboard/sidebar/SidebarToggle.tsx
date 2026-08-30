"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface SidebarToggleProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isMobile: boolean;
}

export function SidebarToggle({ isSidebarOpen, setIsSidebarOpen, isMobile }: SidebarToggleProps) {
    return (
        <div className="flex items-center mt-4">
            <Button
                variant="ghost"
                className={`min-h-10 w-full hover:bg-transparent ${isSidebarOpen ? "justify-between px-2" : "justify-center"}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={isSidebarOpen}
            >
                {isSidebarOpen && !isMobile && (
                    <div>
                        <video
                            src="/output.webm"
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
                <Menu className="h-5 w-5 text-black" />
            </Button>
        </div>
    );
}
