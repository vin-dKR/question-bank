'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import {
    ArrowRight,
    Sparkles,
    Check,
    Search,
    LayoutDashboard,
    Library,
    FileCheck2,
    BarChart3,
    Files,
    Plus,
    Filter,
    Bell,
} from "lucide-react";
import Link from "next/link";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

type Subject = "all" | "Physics" | "Chemistry" | "Math";

type SampleQuestion = {
    id: string;
    number: number;
    subject: Exclude<Subject, "all">;
    chapter: string;
    latex: string;
    options: string[];
};

const SAMPLE_QUESTIONS: SampleQuestion[] = [
    {
        id: "p1",
        number: 1,
        subject: "Physics",
        chapter: "Kinematics",
        latex:
            "A particle moves with velocity \\(v = 3t^2 - 6t\\ \\text{m/s}\\). Find its displacement from \\(t=0\\) to \\(t=4s\\).",
        options: ["8 m", "16 m", "24 m", "32 m"],
    },
    {
        id: "m1",
        number: 2,
        subject: "Math",
        chapter: "Integrals",
        latex: "Evaluate \\(\\int_{0}^{\\pi/2} \\sin^2 x\\, dx\\).",
        options: ["\\(\\pi/2\\)", "\\(\\pi/4\\)", "\\(\\pi\\)", "\\(1\\)"],
    },
    {
        id: "c1",
        number: 3,
        subject: "Chemistry",
        chapter: "Stoichiometry",
        latex:
            "How many moles of \\(O_2\\) are needed to completely combust 2 mol of \\(C_2H_6\\)?",
        options: ["3.5", "5", "7", "9"],
    },
    {
        id: "m2",
        number: 4,
        subject: "Math",
        chapter: "Algebra",
        latex:
            "If \\(x + \\frac{1}{x} = 3\\), find \\(x^2 + \\frac{1}{x^2}\\).",
        options: ["5", "7", "9", "11"],
    },
    {
        id: "p2",
        number: 5,
        subject: "Physics",
        chapter: "Optics",
        latex:
            "A concave mirror has focal length \\(f = 10\\ \\text{cm}\\). Object at \\(u = -15\\ \\text{cm}\\). Find image distance.",
        options: ["-30 cm", "-20 cm", "15 cm", "30 cm"],
    },
];

const SUBJECT_COLORS: Record<Exclude<Subject, "all">, string> = {
    Physics: "bg-violet-50 text-violet-700",
    Math: "bg-indigo-50 text-indigo-700",
    Chemistry: "bg-emerald-50 text-emerald-700",
};

const SIDEBAR_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", active: false, badge: null },
    { icon: Library, label: "Question Bank", active: true, badge: "12k" },
    { icon: FileCheck2, label: "Examinations", active: false, badge: "8" },
    { icon: BarChart3, label: "Analytics", active: false, badge: null },
    { icon: Files, label: "Templates", active: false, badge: null },
] as const;

const Hero = () => {
    const { user } = useCurrentUser();
    const [activeSubject, setActiveSubject] = useState<Subject>("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["p1", "m1"]));

    const filtered =
        activeSubject === "all"
            ? SAMPLE_QUESTIONS
            : SAMPLE_QUESTIONS.filter((q) => q.subject === activeSubject);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <section className="relative bg-white pt-24 pb-16 md:pt-36 md:pb-24">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(ellipse 600px 300px at 80% 20%, rgba(168,85,247,0.06), transparent 50%)",
                }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
                }}
            />

            <div className="relative mx-auto max-w-[1000px] px-4 sm:px-6">
                <div className="flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-xs">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        <span>AI-powered test creation</span>
                    </div>

                    <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl leading-[1.05]">
                        Create exams effortlessly.
                        <span className="mt-2 block bg-gradient-to-r from-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                            Built for modern teachers.
                        </span>
                    </h1>

                    <p className="mt-5 max-w-xl text-base text-zinc-500 sm:text-lg leading-relaxed">
                        AI-powered question extraction, beautiful PDF generation, and deep analytics on every student&apos;s performance — all in one workspace.
                    </p>

                    <div className="mt-8 flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
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

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Free to start
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            No credit card
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Cancel anytime
                        </span>
                    </div>
                </div>

                {/* Full dashboard mock */}
                <div className="relative mt-14 md:mt-20">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-8 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent blur-2xl -z-10"
                    />
                    <div className="mx-auto max-w-5xl rounded-xl border border-black/5 bg-white shadow-2xl overflow-hidden">
                        {/* Browser chrome */}
                        <div className="flex items-center gap-1.5 border-b border-black/5 bg-zinc-50 px-4 py-2.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                            <div className="ml-3 h-5 flex-1 max-w-sm rounded-md bg-white border border-black/5 flex items-center gap-1.5 px-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] text-zinc-500 font-mono truncate">eduents.com/question-bank</span>
                            </div>
                        </div>

                        <div className="flex min-h-[460px] md:min-h-[520px]">
                            {/* Sidebar */}
                            <aside className="hidden sm:flex w-14 md:w-52 flex-col border-r border-black/5 bg-white">
                                <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 border-b border-black/5">
                                    <video
                                        src="/output.webm"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        preload="auto"
                                        width={32}
                                        height={32}
                                        className="block h-8 w-8 flex-shrink-0"
                                    />
                                    <span className="hidden md:inline text-sm font-semibold tracking-tight text-zinc-900">
                                        Eduents
                                    </span>
                                </div>

                                <nav className="flex-1 p-2 space-y-0.5">
                                    {SIDEBAR_ITEMS.map((item) => {
                                        const Icon = item.icon;
                                        const active = item.active;
                                        return (
                                            <div
                                                key={item.label}
                                                className={`relative flex items-center gap-2.5 px-2 md:px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                                    active
                                                        ? "bg-indigo-50 text-indigo-700"
                                                        : "text-zinc-500 hover:bg-zinc-50"
                                                }`}
                                            >
                                                {active && (
                                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-indigo-600" />
                                                )}
                                                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-zinc-400"}`} strokeWidth={2} />
                                                <span className="hidden md:inline flex-1 truncate">{item.label}</span>
                                                {item.badge && (
                                                    <span className={`hidden md:inline text-[9px] font-mono px-1 rounded ${active ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </nav>

                                {/* User footer */}
                                <div className="hidden md:flex items-center gap-2 p-3 border-t border-black/5">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[10px] font-semibold text-white">
                                        T
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-medium text-zinc-900 truncate">Tanvi Sharma</p>
                                        <p className="text-[10px] text-zinc-400 truncate">Coaching Institute</p>
                                    </div>
                                </div>
                            </aside>

                            {/* Main content */}
                            <div className="flex-1 min-w-0 flex flex-col bg-white">
                                {/* Top header */}
                                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 md:px-6 md:py-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-0.5">
                                            <span>Workspace</span>
                                            <span>/</span>
                                            <span className="text-zinc-600">Question Bank</span>
                                        </div>
                                        <h3 className="text-sm md:text-base font-semibold tracking-tight text-zinc-900">
                                            JEE Main · 2024 Batch
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative hidden sm:flex">
                                            <Bell className="h-4 w-4 text-zinc-400" />
                                            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        </div>
                                        <div className="h-7 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 text-[11px] font-medium text-white shadow-sm">
                                            <Plus className="h-3 w-3" />
                                            <span className="hidden sm:inline">Create Test</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats strip */}
                                <div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5">
                                    {[
                                        { label: "Questions", value: "12,480", delta: "+124 this week", positive: true },
                                        { label: "Selected", value: String(selectedIds.size).padStart(2, "0"), delta: `of ${filtered.length} shown`, positive: null },
                                        { label: "Avg. difficulty", value: "7.2/10", delta: "JEE-Adv level", positive: null },
                                    ].map((s) => (
                                        <div key={s.label} className="px-3 py-2.5 md:px-5 md:py-3">
                                            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{s.label}</p>
                                            <p className="mt-0.5 text-sm md:text-lg font-semibold tracking-tight text-zinc-900 tabular-nums">{s.value}</p>
                                            <p className={`text-[10px] ${s.positive ? "text-emerald-600" : "text-zinc-400"}`}>{s.delta}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Toolbar */}
                                <div className="border-b border-black/5 px-3 py-3 md:px-5 md:py-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1 min-w-0">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                            <div className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-black/5 bg-zinc-50 text-zinc-500 flex items-center">
                                                integrals
                                                <span className="ml-0.5 inline-block h-3 w-px bg-zinc-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-1 h-8 rounded-md border border-black/5 bg-white px-2 text-[11px] text-zinc-600 font-medium">
                                            <Filter className="h-3 w-3" />
                                            <span className="hidden sm:inline">Filters</span>
                                            <span className="px-1 rounded bg-indigo-100 text-indigo-700 text-[9px] font-mono">2</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(["all", "Physics", "Math", "Chemistry"] as Subject[]).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setActiveSubject(s)}
                                                className={`px-2.5 h-7 text-xs font-medium rounded-md transition-colors ${
                                                    activeSubject === s
                                                        ? "bg-zinc-900 text-white"
                                                        : "text-zinc-600 hover:bg-zinc-100"
                                                }`}
                                            >
                                                {s === "all" ? "All" : s}
                                                <span className={`ml-1.5 text-[10px] ${activeSubject === s ? "opacity-70" : "opacity-50"}`}>
                                                    {s === "all" ? SAMPLE_QUESTIONS.length : SAMPLE_QUESTIONS.filter(q => q.subject === s).length}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Question list */}
                                <div className="flex-1 max-h-[320px] overflow-y-auto bg-white">
                                    <ul className="divide-y divide-black/5">
                                        {filtered.map((q) => {
                                            const isSelected = selectedIds.has(q.id);
                                            return (
                                                <li
                                                    key={q.id}
                                                    onClick={() => toggleSelect(q.id)}
                                                    className={`group flex cursor-pointer gap-3 px-3 py-3 md:px-5 md:py-3.5 transition-colors ${
                                                        isSelected ? "bg-indigo-50/40" : "hover:bg-zinc-50"
                                                    }`}
                                                >
                                                    <div
                                                        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                                                            isSelected
                                                                ? "border-indigo-600 bg-indigo-600"
                                                                : "border-zinc-300 bg-white group-hover:border-zinc-400"
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-[11px] font-mono text-zinc-400">Q{q.number}</span>
                                                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${SUBJECT_COLORS[q.subject]}`}>
                                                                {q.subject}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">· {q.chapter}</span>
                                                            {q.id === "m1" && (
                                                                <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-medium">
                                                                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                                                                    Hard
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs md:text-sm text-zinc-800 leading-relaxed">
                                                            <LatexLine latex={q.latex} />
                                                        </div>
                                                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className="flex items-center gap-1.5 text-[11px] md:text-xs text-zinc-500">
                                                                    <span className="font-mono text-[10px] text-zinc-400">{String.fromCharCode(65 + i)}</span>
                                                                    <span className="truncate">
                                                                        <LatexLine latex={opt} />
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                {/* Footer action bar */}
                                <div className="flex items-center justify-between border-t border-black/5 bg-zinc-50/70 px-3 py-2.5 md:px-5 md:py-3">
                                    <span className="text-[11px] text-zinc-500">
                                        <span className="font-medium text-zinc-900">{selectedIds.size}</span> selected · <span className="hidden sm:inline">{filtered.length} shown</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden md:flex h-7 items-center rounded-md border border-black/5 bg-white px-2.5 text-[11px] text-zinc-600 font-medium">
                                            Export PDF
                                        </div>
                                        <div className="h-7 flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 text-[11px] text-white font-medium">
                                            Create Test
                                            <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating stat cards — positioned to overlap page borders */}
                    <div className="absolute z-30 -left-24 xl:-left-36 top-24 hidden xl:flex flex-col rounded-xl border border-black/5 bg-white px-4 py-3 shadow-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            <span className="text-[10px] uppercase tracking-wide text-zinc-400">AI Extracted</span>
                        </div>
                        <span className="text-base font-semibold tracking-tight text-zinc-900 tabular-nums">12,480</span>
                        <span className="text-[10px] text-emerald-600">+124 this week</span>
                    </div>
                    <div className="absolute z-30 -right-24 xl:-right-36 top-56 hidden xl:flex flex-col rounded-xl border border-black/5 bg-white px-4 py-3 shadow-xl">
                        <span className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Avg. time saved</span>
                        <span className="text-base font-semibold tracking-tight text-zinc-900">5.2 hrs/wk</span>
                        <div className="mt-1 h-1 w-20 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full w-[80%] bg-gradient-to-r from-indigo-500 to-violet-500" />
                        </div>
                    </div>
                    <div className="absolute z-30 -right-8 xl:-right-20 bottom-16 hidden lg:flex items-center gap-2 rounded-lg border border-black/5 bg-white px-3 py-2 shadow-xl">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-[11px] text-zinc-700 font-medium">Rahul is editing Q3</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

function LatexLine({ latex }: { latex: string }) {
    const parts: Array<{ type: "text" | "latex"; value: string }> = [];
    let i = 0;
    let buf = "";
    while (i < latex.length) {
        if (latex.slice(i).startsWith("\\(")) {
            const end = latex.indexOf("\\)", i + 2);
            if (end !== -1) {
                if (buf) {
                    parts.push({ type: "text", value: buf });
                    buf = "";
                }
                parts.push({ type: "latex", value: latex.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }
        buf += latex[i];
        i++;
    }
    if (buf) parts.push({ type: "text", value: buf });

    return (
        <>
            {parts.map((p, idx) =>
                p.type === "latex" ? (
                    <InlineMath key={idx} math={p.value} />
                ) : (
                    <span key={idx}>{p.value}</span>
                ),
            )}
        </>
    );
}

export default Hero;
