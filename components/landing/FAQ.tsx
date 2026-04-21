import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
    const faqs = [
        {
            question: "How does the AI question extraction work?",
            answer:
                "Upload a paper image or PDF. Our AI detects bounding boxes around each question and diagram, then extracts structured text ready to save to your bank.",
        },
        {
            question: "What exam formats are supported?",
            answer:
                "JEE Main, JEE Advanced, NEET, CBSE Board, state boards, and custom formats. Build tests for any subject and pattern.",
        },
        {
            question: "Can I customize PDF test papers?",
            answer:
                "Yes — layout, branding, question order, answer key format, and OMR sheet design are all fully customizable.",
        },
        {
            question: "Is there a student limit?",
            answer:
                "Free plan supports up to 50 students. Professional and Institution plans are unlimited with advanced analytics.",
        },
        {
            question: "How accurate is OMR scanning?",
            answer:
                "99%+ accuracy. Process hundreds of sheets in minutes with instant result generation.",
        },
        {
            question: "Do you offer training and support?",
            answer:
                "Comprehensive onboarding, video tutorials, and dedicated support on paid plans. Free users get community support.",
        },
    ];

    return (
        <section className="py-20 md:py-24 bg-white">
            <div className="mx-auto max-w-[900px] px-4 sm:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
                        Frequently asked questions
                    </h2>
                    <p className="mt-3 text-base md:text-lg text-zinc-500">
                        Everything you need to know about Eduents.
                    </p>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border border-black/5 rounded-xl bg-white shadow-xs px-2"
                        >
                            <AccordionTrigger className="px-4 py-4 text-left text-sm md:text-base font-medium text-zinc-900 hover:no-underline">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};

export default FAQ;
