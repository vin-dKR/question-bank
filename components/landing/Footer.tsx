import React from 'react';
import { Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-black/5 py-12 md:py-16">
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    <div className="col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Eduents</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                            Your platform for seamless learning and community engagement. Discover courses, join events, and connect globally.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                <Linkedin size={18} />
                            </a>
                            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Company</h4>
                        <div className="flex flex-col gap-2 text-sm">
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">About</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Careers</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Blog</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Privacy</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Terms</a>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Resources</h4>
                        <div className="flex flex-col gap-2 text-sm">
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Help Center</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Community</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Tutorials</a>
                            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">FAQ</a>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Contact</h4>
                        <div className="flex flex-col gap-2 text-sm text-zinc-600">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-zinc-400" />
                                <span>support@eduents.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-zinc-400" />
                                <span>+1 (000) 123-4567</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                                <span>123 Learning St, Education City</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-black/5 text-center">
                    <p className="text-xs text-zinc-400">
                        © 2025 Eduents. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
