import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Clock, Star } from "lucide-react";

const CallToAction = () => {
    return (
        <section className="py-20 bg-muted relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center space-y-8">
                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-12">
                        <div className="flex items-center space-x-3 text-muted-foreground">
                            <Users className="text-foreground" size={20} />
                            <span className="text-lg">10,000+ Teachers</span>
                        </div>
                        <div className="flex items-center space-x-3 text-muted-foreground">
                            <Clock className="text-foreground" size={20} />
                            <span className="text-lg">Save 5+ Hours/Week</span>
                        </div>
                        <div className="flex items-center space-x-3 text-muted-foreground">
                            <Star className="text-foreground" size={20} />
                            <span className="text-lg">4.9/5 Rating</span>
                        </div>
                    </div>

                    {/* Main CTA Content */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-inter">
                            Ready to Transform Your Teaching?
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Join thousands of educators who are already saving time and improving student outcomes with Eduents.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <Button size="lg" className="text-lg px-10 py-6">
                            Start Free Trial
                            <ArrowRight className="ml-2" size={20} />
                        </Button>
                        <Button variant="outline" size="lg" className="text-lg px-10 py-6">
                            Schedule Demo
                        </Button>
                    </div>

                    {/* Trust indicators */}
                    <div className="pt-8 text-sm text-muted-foreground">
                        <p>No credit card required • Cancel anytime • Free forever plan available</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction
