import {
    Library,
    Wand2,
    FileText,
    Monitor,
    ScanLine,
    BarChart3,
} from "lucide-react";

const Features = () => {
    const features = [
        {
            icon: Wand2,
            kicker: "01",
            title: "AI Extraction",
            description:
                "Upload a paper image or PDF. Our vision model detects each question, crops attached diagrams, and extracts structured text — ready to edit or save.",
            visual: (
                <div className="space-y-2">
                    <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-3 text-center">
                        <p className="text-[11px] font-medium text-indigo-700">paper-01.pdf</p>
                        <div className="mt-2 h-1 w-full rounded-full bg-indigo-100 overflow-hidden">
                            <div className="h-full w-[62%] bg-indigo-600" />
                        </div>
                        <p className="mt-1.5 text-[10px] text-indigo-500">Extracting page 3/5…</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        28 questions · 6 diagrams detected
                    </div>
                </div>
            ),
        },
        {
            icon: Library,
            kicker: "02",
            title: "Question Bank",
            description:
                "12,000+ curated questions across JEE, NEET, and Board exams. Filter by chapter, topic, difficulty. Tag your own. Search with native LaTeX.",
            visual: (
                <div className="space-y-1.5">
                    {[
                        { name: "Mechanics", count: 842 },
                        { name: "Thermodynamics", count: 416 },
                        { name: "Organic Chemistry", count: 1204 },
                        { name: "Calculus", count: 689 },
                    ].map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-[11px] py-1">
                            <span className="text-zinc-700">{c.name}</span>
                            <span className="font-mono text-zinc-400">{c.count}</span>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            icon: FileText,
            kicker: "03",
            title: "PDF Export",
            description:
                "Generate beautiful test papers with your institution's branding, answer keys, solutions, and OMR sheets — all in one click.",
            visual: (
                <div className="flex items-start gap-2">
                    <div className="flex-1 rounded-md border border-black/5 bg-white p-2 shadow-xs">
                        <div className="space-y-1">
                            <div className="h-1 w-2/3 rounded bg-zinc-300" />
                            <div className="h-1 w-full rounded bg-zinc-200" />
                            <div className="h-1 w-5/6 rounded bg-zinc-200" />
                        </div>
                        <p className="mt-2 text-[9px] font-mono text-zinc-400">test_paper.pdf</p>
                    </div>
                    <div className="flex-1 rounded-md border border-black/5 bg-white p-2 shadow-xs">
                        <div className="grid grid-cols-5 gap-0.5">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i % 4 === 0 ? 'bg-zinc-900' : 'border border-zinc-300'}`} />
                            ))}
                        </div>
                        <p className="mt-2 text-[9px] font-mono text-zinc-400">omr_sheet.pdf</p>
                    </div>
                </div>
            ),
        },
        {
            icon: Monitor,
            kicker: "04",
            title: "Online Testing",
            description:
                "Conduct secure, proctored online tests. Real-time monitoring, auto-scoring, and result sheets generated the moment the last student submits.",
            visual: (
                <div className="rounded-md border border-black/5 bg-white p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-zinc-900">Physics Mock · Live</span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            47 online
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <span>Elapsed</span>
                        <span className="font-mono text-zinc-900">42:18</span>
                        <span className="ml-auto">ends 17:42</span>
                    </div>
                </div>
            ),
        },
        {
            icon: ScanLine,
            kicker: "05",
            title: "OMR Scanning",
            description:
                "Scan bubble sheets with 99%+ accuracy. Process hundreds at once. Roll-number detection, auto-grading, and score export to Excel.",
            visual: (
                <div className="flex gap-2">
                    {[92, 78, 64, 88].map((score, i) => (
                        <div key={i} className="flex-1 rounded-md bg-zinc-50 border border-black/5 p-2 text-center">
                            <p className="text-[10px] text-zinc-400 font-mono">#{String(i + 1).padStart(3, '0')}</p>
                            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{score}</p>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            icon: BarChart3,
            kicker: "06",
            title: "Deep Analytics",
            description:
                "Per-student, per-chapter, per-topic insights. See exactly which concepts every learner is struggling with — and who's ready for harder questions.",
            visual: (
                <div className="flex items-end gap-1.5 h-20">
                    {[45, 62, 38, 78, 52, 88, 71, 94, 66].map((v, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400"
                            style={{ height: `${v}%` }}
                        />
                    ))}
                </div>
            ),
        },
    ];

    return (
        <section className="py-6 md:py-10 bg-white">
            <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
                <div className="divide-y divide-black/5">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        const reverse = index % 2 === 1;
                        return (
                            <div
                                key={index}
                                className={`flex flex-col gap-6 py-10 md:py-14 md:gap-12 md:flex-row md:items-center ${
                                    reverse ? "md:flex-row-reverse" : ""
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <span className="font-mono text-xs text-zinc-400 tabular-nums">{feature.kicker}</span>
                                        <span className="h-px w-6 bg-zinc-200" />
                                        <div className="flex h-5 w-5 items-center justify-center text-indigo-600">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-3 text-sm md:text-base text-zinc-500 leading-relaxed max-w-md">
                                        {feature.description}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-0 md:max-w-sm">
                                    <div className="rounded-lg bg-zinc-50 border border-black/5 p-4">
                                        {feature.visual}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Features;
