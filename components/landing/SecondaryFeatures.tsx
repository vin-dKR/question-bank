import { Shield, Zap, Globe } from "lucide-react";

const SecondaryFeatures = () => {
    const features = [
        {
            icon: Shield,
            title: "Secure & reliable",
            description: "Bank-grade security. 99.9% uptime SLA.",
        },
        {
            icon: Zap,
            title: "Lightning fast",
            description: "Hundreds of questions generated in seconds.",
        },
        {
            icon: Globe,
            title: "Multi-subject",
            description: "Physics, Chemistry, Maths, Biology, and more.",
        },
    ];

    return (
        <section className="py-20 md:py-24 bg-zinc-50 border-y border-black/5">
            <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
                <div className="mb-12 md:mb-16 max-w-xl">
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
                        Why teachers choose Eduents
                    </h2>
                    <p className="mt-3 text-base md:text-lg text-zinc-500 leading-relaxed">
                        Built specifically for Indian educators — with the features that actually matter in the classroom.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="flex gap-4 border-t border-black/5 pt-6">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icon className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SecondaryFeatures;
