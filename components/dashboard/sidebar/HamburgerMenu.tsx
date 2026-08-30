"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export function HamburgerMenu() {
    return (
        <DialogPrimitive.Trigger asChild>
            <Button
                variant="ghost"
                className="h-10 w-10 shrink-0 p-0 hover:bg-zinc-100"
                aria-label="Open main navigation"
                aria-controls="mobile-navigation"
            >
                <Menu className="h-5 w-5 text-zinc-900" />
            </Button>
        </DialogPrimitive.Trigger>
    );
}
