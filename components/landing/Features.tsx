
const Features = () => {
    {/*
        import {
        FileText,
        Monitor,
        ScanLine,
        BarChart3,
        Bubbles,
        Waves
        } from "lucide-react";
    const features = [
        {
            icon: Waves,
            title: "Question Bank Access",
            description: "Comprehensive question bank for JEE Main, JEE Advanced, NEET, and Board exams with thousands of curated questions."
        },
        {
            icon: Bubbles,
            title: "AI-Powered Question Extraction",
            description: "Extract questions from images and documents using advanced AI technology for seamless question bank expansion."
        },
        {
            icon: FileText,
            title: "PDF Test Export",
            description: "Generate professional PDF test papers with customizable layouts, answer keys, and OMR sheets instantly."
        },
        {
            icon: Monitor,
            title: "Online Testing",
            description: "Conduct secure online tests with real-time monitoring, instant scoring, and automated result generation."
        },
        {
            icon: ScanLine,
            title: "OMR Sheet Scanning",
            description: "Automated OMR sheet scanning and evaluation with high accuracy and instant result processing."
        },
        {
            icon: BarChart3,
            title: "Student Analytics",
            description: "Comprehensive performance analytics with detailed insights into student progress and learning patterns."
        }
    ];
    */}

    const featureSteps = [
        {
            img: "",
            title: "Bank",
            description: "Questions"
        },
        {
            img: "",
            title: "AI",
            description: "Extract"
        },
        {
            img: "",
            title: "PDF",
            description: "Export"
        },
        {
            img: "",
            title: "Testing",
            description: "Online"
        },
        {
            img: "",
            title: "Scanning",
            description: "OMR"
        },
        {
            img: "",
            title: "Analytics",
            description: "Students"
        },
    ]
    return (
        <section className="py-2 md:py-5 bg-background relative">

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
                    {featureSteps.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-[#F5F5F5] hover:bg-muted transition-all duration-300 aspect-square flex flex-col items-center"
                        >
                            <div className="flex-grow flex items-center justify-center mb-4">
                                <div className="h-20 w-20 bg-white flex items-center justify-center rounded-full">
                                    <div className="h-20 w-20 bg-primary rounded-full">
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-center tracking-1">
                                {feature.title}
                            </p>
                            <h3 className="text-lg font-semibold text-foreground mb-2 font-inter text-center tracking-1">
                                {feature.description}
                            </h3>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Features;
