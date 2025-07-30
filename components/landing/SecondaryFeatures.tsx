import { Shield, Zap, Users, Globe } from "lucide-react";

const SecondaryFeatures = () => {
    const features = [
        {
            icon: Shield,
            title: "Secure & Reliable",
            description: "Bank-grade security with 99.9% uptime guarantee"
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Process thousands of questions in seconds"
        },
        {
            icon: Users,
            title: "Collaborative",
            description: "Share question banks with your team"
        },
        {
            icon: Globe,
            title: "Multi-Language",
            description: "Support for Hindi, English, and regional languages"
        }
    ];

    return (
        <section className="py-20 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-inter">
                        Why Choose Eduents?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Built specifically for Indian educators with features that matter most
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <div key={index} className="text-center">
                                <div className="mx-auto w-12 h-12 flex items-center justify-center border border-border mb-4">
                                    <IconComponent size={24} className="text-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2 font-inter">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SecondaryFeatures;
