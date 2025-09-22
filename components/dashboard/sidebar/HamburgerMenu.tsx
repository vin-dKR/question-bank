"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HamburgerMenuProps {
    setIsSidebarOpen: (open: boolean) => void;
}

export function HamburgerMenu({ setIsSidebarOpen }: HamburgerMenuProps) {
    return (
        <Button
            variant="ghost"
            className="sm:hidden z-50"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
        >
            <Menu className="h-8 w-8 text-black" />
        </Button>
    );
}
