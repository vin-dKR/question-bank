import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
    return (
        <section className="h-screen py-60 md:py-90 bg-background relative">
            {/* Horizontal line */}
            <div className="absolute top-0 left-0 w-full"></div>

            <div className="max-w-[1000px] mx-auto relative px-4">
                <div className="text-center space-y-8">
                    <div className="space-y-6 tracking-0">
                        <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight font-inter">
                            Create Exams Effortlessly.
                            <span className="block text-gray-400">Streamline test creation and analytics for teachers.</span>
                        </h1>
                        <p style={{ lineHeight: "normal" }} className="text-md md:text-lg text-black/60 tracking-1 leading-relaxed max-w-3xl mx-auto px-8 w-full md:w-100 text-center">
                            with AI-powered question extraction, PDF generation, and comprehensive student performance analytics.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center tracking-1">
                        <Link href='/auth/signup'>
                            <Button size="sm" className="text-lg px-4 md:px-8 py-4 bg-black text-white md:size-md font-bold">
                                Get Started
                                <ArrowRight className="ml-2" size={20} />
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="text-lg px-4 md:px-8 py-4 md:size-md font-bold">
                            <Link href='/demo'>
                                Watch Demo
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center justify-center text-sm text-muted-foreground mx-auto">
                        <div className="hidden md:block flex flex-row items-center justify-center text-xs text-sm bg-[#999999] gap-4 px-4 py-1 rounded-full border border-black/10 tracking-2">
                            <span>Free to start</span>
                            <span className="mx-4">•</span>
                            <span>No credit card required</span>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
};

export default Hero;
