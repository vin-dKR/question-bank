import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
    const plans = [
        {
            name: "Free",
            price: "₹0",
            period: "forever",
            features: [
                "50 questions per month",
                "Basic question bank access",
                "PDF export (5 per month)",
                "Community support"
            ]
        },
        {
            name: "Professional",
            price: "₹999",
            period: "per month",
            popular: true,
            features: [
                "Unlimited questions",
                "Full question bank access",
                "Unlimited PDF exports",
                "Online testing platform",
                "OMR sheet scanning",
                "Priority support"
            ]
        },
        {
            name: "Institution",
            price: "₹4999",
            period: "per month",
            features: [
                "Everything in Professional",
                "Multi-user accounts",
                "Advanced analytics",
                "Custom branding",
                "API access",
                "Dedicated support"
            ]
        }
    ];

    return (
        <section className="py-20 bg-muted relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-inter">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Choose the plan that fits your needs
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`p-8 border bg-background ${plan.popular
                                ? 'border-foreground'
                                : 'border-border'
                                } relative`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-foreground text-background px-3 py-1 text-sm font-medium">
                                        Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <h3 className="text-xl font-semibold text-foreground mb-2 font-inter">
                                    {plan.name}
                                </h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                    <span className="text-muted-foreground ml-1">/{plan.period}</span>
                                </div>
                                <Button
                                    variant={plan.popular ? "default" : "outline"}
                                    className="w-full"
                                >
                                    Get Started
                                </Button>
                            </div>

                            <ul className="space-y-3">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-center text-sm">
                                        <Check size={16} className="text-foreground mr-3 flex-shrink-0" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
