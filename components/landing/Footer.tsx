const Footer = () => {
    return (
        <footer className="bg-red-400 py-12 relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center space-y-8">
                    <h3 className="text-2xl font-bold text-foreground font-inter">Eduents</h3>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-sm">
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
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
