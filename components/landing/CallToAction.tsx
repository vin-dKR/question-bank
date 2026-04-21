import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Users, Clock, Star } from "lucide-react";
import Link from "next/link";

const CallToAction = () => {
    const { user } = useUser();

    return (
        <section className="relative overflow-hidden py-20 md:py-28 bg-zinc-50 border-t border-black/5">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse 600px 300px at 50% 100%, rgba(99,102,241,0.08), transparent 60%)",
                }}
            />

            <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
                <div className="text-center">
                    {/* Stats row */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-10">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">10,000+ Teachers</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">Save 5+ Hours / Week</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <Star className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">4.9/5 Rating</span>
                        </div>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
                        Ready to transform your teaching?
                    </h2>
                    <p className="mt-4 max-w-xl mx-auto text-base md:text-lg text-zinc-500 leading-relaxed">
                        Join thousands of educators saving time and improving student outcomes with Eduents.
                    </p>

                    <div className="mt-8 flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                        <Button size="lg" className="w-full sm:w-auto" asChild>
                            <Link href="/auth/signup" className="flex items-center justify-center">
                                {user ? 'Go to Dashboard' : 'Get Started Free'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                            <Link href="/demo" className="flex items-center justify-center">
                                Watch Demo
                            </Link>
                        </Button>
                    </div>

                    <p className="mt-6 text-xs text-zinc-500">
                        No credit card required · Cancel anytime · Free forever plan
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
