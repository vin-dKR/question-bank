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
                className={`w-full ${isSidebarOpen ? "justify-between px-2" : "justify-center"}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={isSidebarOpen}
            >
                {isSidebarOpen && !isMobile && (
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
    );
}
