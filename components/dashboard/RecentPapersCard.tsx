import Link from "next/link";
import { ArrowRight, Calendar, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaperHistories } from "@/actions/paperHistory/paperHistory";

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
});

export async function RecentPapersCard() {
    const recentPapers = await getPaperHistories(5);

    return (
        <div className="md:col-span-1 rounded-xl border border-black/5 bg-white p-6 shadow-xs mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-500">Recent Papers</h3>
                <Link href="/history">
                    <Button size="sm" variant="ghost" className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900">
                        View all
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>

            {recentPapers.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm text-zinc-600">No papers generated yet</p>
                    <p className="text-xs text-zinc-400 mt-1">Create your first paper from the Questions page</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {recentPapers.map((paper) => (
                        <div
                            key={paper.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="hidden md:block h-4 w-4 text-zinc-400 flex-shrink-0" />
                                <div className="min-w-0">
                                    <div className="flex gap-1 items-baseline">
                                        <h4 className="font-medium text-sm text-zinc-900 truncate">{paper.title}</h4>
                                        {paper.subject && <span className="text-xs text-zinc-400">· {paper.subject}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                                        <span>{paper.questions.length} qs.</span>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span className="hidden md:block">
                                                {longDateFormatter.format(new Date(paper.createdAt))}
                                            </span>
                                            <span className="md:hidden block">
                                                {shortDateFormatter.format(new Date(paper.createdAt))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link href={`/history?view=${paper.id}`}>
                                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
