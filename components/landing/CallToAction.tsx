import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Clock, Star } from "lucide-react";
import Link from "next/link";

const CallToAction = () => {
    return (
        <section className="py-20 bg-muted relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center space-y-8">
                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-8">
                        <div className="flex items-center space-x-3 text-muted-foreground">
                            <Users className="text-foreground" size={20} />
                            <span className="text-lg tracking-2">10,000+ Teachers</span>
                        </div>
                        <div className="flex items-center space-x-3 text-muted-foreground">
                            <Clock className="text-foreground" size={20} />
                            <span className="text-lg tracking-2">Save 5+ Hours/Week</span>
                        </div>
                        <div className="flex items-center space-x-3 text-muted-foreground">
                            <Star className="text-foreground" size={20} />
                            <span className="text-lg tracking-2">4.9/5 Rating</span>
                        </div>
                    </div>

                    {/* Main CTA Content */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-inter tracking-2">
                            Ready to Transform Your Teaching?
                        </h2>
                        <p style={{ lineHeight: "normal" }} className="text-md md:text-lg text-black/60 tracking-1 leading-relaxed max-w-3xl mx-auto px-8 w-full md:w-100 text-center">
                            Join thousands of educators who are already saving time and improving student outcomes with Eduents.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center tracking-1">
                            <Button size="sm" className="text-lg px-4 md:px-8 py-4 bg-black text-white md:size-md font-bold">
                                <Link href='/auth/signup'>
                                    Get Started
                                </Link>
                                <ArrowRight className="ml-2" size={20} />
                            </Button>
                            <Button variant="outline" size="sm" className="text-lg px-4 md:px-8 py-4 md:size-md font-bold">
                                <Link href='/demo'>
                                    Watch Demo
                                </Link>
                            </Button>
                        </div>

                    </div>

                    {/* Trust indicators */}
                    <div className="flex items-center justify-center text-sm text-muted-foreground mx-auto">
                        <div className="hidden md:block flex flex-row items-center justify-center text-xs text-sm bg-[#999999] gap-4 px-4 py-1 rounded-full border border-black/10 tracking-2">
                            <span>Free to start</span>
                            <span className="mx-4">•</span>
                            <span>No credit card required</span>
                            <span className="mx-4">•</span>
                            <span>Free forever plan available</span>
                        </div>
                    </div>
                    <div className="block md:hidden pt-8 text-xs text-muted-foreground tracking-1">
                        <p>No credit card required • Cancel anytime • Free forever plan available</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction
