const CoreFeaturesIntro = () => {
    return (
        <section className="pb-20 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center space-y-2 md:pace-y-6">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-inter tracking-2">
                        Core Features
                    </h2>
                    <p style={{ lineHeight: "normal" }} className="text-md/10 text-md md:text-2xl text-black/60 tracking-1 leading-relaxed max-w-3xl mx-auto px-8">
                        Everything you need to transform your teaching and assessment workflow
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CoreFeaturesIntro;
