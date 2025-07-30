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
            answer: "Our AI technology can analyze images and documents to extract questions automatically. Simply upload your content, and our system will identify and format questions for your question bank."
        },
        {
            question: "What exam formats are supported?",
            answer: "We support JEE Main, JEE Advanced, NEET, CBSE Board exams, state board exams, and custom formats. You can create tests for any subject and examination pattern."
        },
        {
            question: "Can I customize the PDF test papers?",
            answer: "Yes, you can fully customize your test papers including layout, branding, question order, answer key format, and OMR sheet design."
        },
        {
            question: "Is there a limit on the number of students?",
            answer: "The Free plan supports up to 50 students. Professional and Institution plans offer unlimited student accounts with advanced analytics."
        },
        {
            question: "How accurate is the OMR sheet scanning?",
            answer: "Our OMR scanning technology has 99.5% accuracy rate and can process hundreds of sheets in minutes with instant result generation."
        },
        {
            question: "Do you offer training and support?",
            answer: "Yes, we provide comprehensive onboarding, video tutorials, and dedicated support for all paid plans. Free users get community support."
        }
    ];

    return (
        <section className="py-20 bg-background relative">
            <div className="absolute top-0 left-0 w-full h-px bg-border"></div>

            <div className="max-w-[1200px] mx-auto px-8 relative">
                <div className="absolute -left-8 top-0 w-px h-full bg-border"></div>
                <div className="absolute -right-8 top-0 w-px h-full bg-border"></div>

                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-inter tracking-1">
                        Frequently Asked Questions
                    </h2>
                    <p style={{ lineHeight: "normal" }} className="text-md md:text-lg text-black/60 tracking-1 leading-relaxed max-w-3xl mx-auto px-8 w-full md:w-100 text-center">
                        Everything you need to know about Eduents
                    </p>
                </div>

                <div className="max-w-3xl mx-auto tracking-3 pb-6">
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border border-black/10 rounded-2xl">
                                <AccordionTrigger className="px-6 py-4 text-left font-medium">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
