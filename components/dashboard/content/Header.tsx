"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import type { UserResource } from "@clerk/types";
import { HamburgerMenu } from "@/components/dashboard/sidebar/HamburgerMenu";
import { useMediaQuery } from "react-responsive";
import { Dispatch, SetStateAction } from "react";


interface HeaderProps {
    activeItem: SidebarItem | SidebarGroup | undefined
    user: UserResource | null | undefined
    handleLogout: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: Dispatch<SetStateAction<boolean>>
}

export function Header({ activeItem, user, handleLogout, isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
    const isMobile = useMediaQuery({ maxWidth: 768 });
    return (
        <header className="border-b border-black/10 px-0 py-2 md:px-4 flex justify-between items-center">
            <div className="flex flex-col items-start space-x-4">
                <div className="flex items-center">
                    {isMobile && !isSidebarOpen && <HamburgerMenu setIsSidebarOpen={setIsSidebarOpen} />}

                    <h1 className="text-xl font-semibold">
                        {activeItem ? ("href" in activeItem ? activeItem.name : activeItem.name) : "Dashboard"}
                    </h1>
                </div>
                {activeItem && (
                    <p className="ml-4 sm:ml-0 text-gray-600/60 text-sm">
                        {"href" in activeItem ? activeItem.description : activeItem.description}
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
                        <span className="hidden md:block">{user?.fullName || "User"}</span>
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
    );
}
