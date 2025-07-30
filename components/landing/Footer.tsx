import React from 'react';
import { Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="py-12 relative border-t border-black/20 bg-background">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1000px] px-8 md:px-0 mx-auto relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* App Description */}
                    <div className="space-y-4 lg:col-span-2">
                        <h3 className="text-2xl font-bold text-foreground font-inter tracking-2">Eduents</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed tracking-3">
                            Eduents is your platform for seamless learning and community engagement. Discover courses, join events, and connect with a global community of learners and educators.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-foreground font-inter tracking-2">Company</h4>
                        <div className="flex flex-col gap-2 text-sm tracking-3">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                        </div>
                    </div>

                    {/* Resources Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-foreground font-inter tracking-2">Resources</h4>
                        <div className="flex flex-col gap-2 text-sm tracking-3">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Community</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Tutorials</a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
                        </div>
                    </div>

                    {/* Contact and Newsletter */}
                    <div className="space-y-4 tracking-3">
                        <h4 className="text-lg font-semibold text-foreground font-inter tracking-2">Get in Touch</h4>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>support@eduents.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>+1 (000) 123-4567</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className='w-4 md:w-7' />
                                <span>123 Learning St, Education City, EC 12345</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center tracking-2">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-sm mb-4">
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2025 Eduents. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
