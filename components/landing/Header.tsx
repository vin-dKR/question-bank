import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const navItems = ["Home", "Features", "Pricing", "Contact"];

const Header = () => {
    const { user } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
            <nav className="mx-auto flex max-w-[1100px] justify-center px-4 lg:px-6">
                <div className="flex w-full items-center justify-between h-14 md:h-16">
                    <div className="flex items-center">
                        <video
                            src="/output.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            width={52}
                            height={52}
                            className="block"
                            style={{ display: 'block' }}
                            onError={(e) => {
                                console.error('Video failed to load:', e);
                                const videoElement = e.currentTarget;
                                if (videoElement.parentElement) {
                                    videoElement.style.display = 'none';
                                    const fallback = document.createElement('h1');
                                    fallback.className = 'text-xl font-semibold tracking-tight text-zinc-900';
                                    fallback.textContent = 'Eduents';
                                    videoElement.parentElement.appendChild(fallback);
                                }
                            }}
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Button
                                key={item}
                                variant="ghost"
                                size="sm"
                                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                            >
                                {item}
                            </Button>
                        ))}
                        <Button size="sm" className="ml-3" asChild>
                            <Link href={user ? '/dashboard' : '/auth/signup'}>
                                {user ? 'Dashboard' : 'Get Started'}
                            </Link>
                        </Button>
                    </div>

                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </Button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden absolute left-0 right-0 top-14 bg-white border-t border-black/5 shadow-sm">
                        <div className="px-4 py-3 space-y-1 max-w-[1100px] mx-auto">
                            {navItems.map((item) => (
                                <Button
                                    key={item}
                                    variant="ghost"
                                    className="w-full justify-start text-sm font-medium text-zinc-600"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item}
                                </Button>
                            ))}
                            <div className="pt-2">
                                <Button className="w-full" asChild>
                                    <Link href={user ? '/dashboard' : '/auth/signup'}>
                                        {user ? 'Dashboard' : 'Get Started'}
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
