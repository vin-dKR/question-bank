import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-black/10 border-b border-border">
            <nav className="flex justify-center max-w-[1000px] px-4 lg:px-0 mx-auto">
                <div className="flex w-full items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        {/*
                        <h1 className="text-xl md:text-2xl font-bold text-primary font-inter tracking-1">Eduents</h1>
                        */}
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

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Button variant="navigation" className="font-medium">
                            Home
                        </Button>
                        <Button variant="navigation" className="font-medium">
                            Features
                        </Button>
                        <Button variant="navigation" className="font-medium">
                            Pricing
                        </Button>
                        <Button variant="navigation" className="font-medium">
                            Contact
                        </Button>
                        <Button variant="default" size="sm" className="ml-4 bg-black text-white cursor-pointer">
                            <Link href='/auth/signup'>
                                Get Started
                            </Link>
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={toggleMenu}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
                            <Button variant="navigation" className="block w-full text-left px-3 py-2 font-medium">
                                Home </Button>
                            <Button variant="navigation" className="block w-full text-left px-3 py-2 font-medium">
                                Features
                            </Button>
                            <Button variant="navigation" className="block w-full text-left px-3 py-2 font-medium">
                                Pricing
                            </Button>
                            <Button variant="navigation" className="block w-full text-left px-3 py-2 font-medium">
                                Contact
                            </Button>
                            <div className="pt-4">
                                <Button variant="default" className="w-full">
                                    <Link href='/auth/signup'>
                                        Get Started
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
