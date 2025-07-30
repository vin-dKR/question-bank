"use client"
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import CoreFeaturesIntro from "@/components/landing/CoreFeaturesIntro";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import SecondaryFeatures from "@/components/landing/SecondaryFeatures";
import CallToAction from "@/components/landing/CallToAction";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

const Index = () => {
    return (
        <div className="min-h-screen w-full bg-white flex flex-col overflow-x-hidden">
            <Header />
            <main className="max-w-[1000px] w-full mx-auto lg:border-l lg:border-r lg:border-gray-300">
                <Hero />
                <CoreFeaturesIntro />
                <Features />
                <Pricing />
                <SecondaryFeatures />
                <CallToAction />
                <FAQ />
            </main>
            <Footer />
        </div>
    );
};

export default Index;

