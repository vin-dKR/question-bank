import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { Check } from "lucide-react";
import Link from "next/link";

const Pricing = () => {
    const { user } = useCurrentUser();

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
        <section className="py-20 md:py-28 bg-white">
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-3 text-base md:text-lg text-zinc-500">
                        Choose the plan that fits your needs.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative rounded-2xl p-7 bg-white flex flex-col ${plan.popular
                                ? 'border-2 border-indigo-500 shadow-lg'
                                : 'border border-black/5 shadow-xs'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-full shadow-sm">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                                    {plan.name}
                                </h3>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-4xl font-semibold tracking-tight text-zinc-900">{plan.price}</span>
                                    <span className="text-sm text-zinc-500 ml-1.5">/{plan.period}</span>
                                </div>
                            </div>

                            <Button
                                variant={plan.popular ? "default" : "outline"}
                                className="w-full"
                                asChild
                            >
                                <Link href={user ? '/dashboard' : '/auth/signup'}>
                                    {user ? "Dashboard" : "Get Started"}
                                </Link>
                            </Button>

                            <ul className="mt-7 space-y-3">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start text-sm text-zinc-600">
                                        <Check size={16} className={`mr-2.5 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-indigo-600' : 'text-emerald-500'}`} />
                                        <span>{feature}</span>
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
