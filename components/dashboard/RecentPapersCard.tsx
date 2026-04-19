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
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Recent Papers</h3>
                <Link href="/history">
                    <Button size="sm" className="flex items-center gap-2 bg-black text-white">
                        View All
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {recentPapers.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No papers generated yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first paper from the Questions page</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recentPapers.map((paper) => (
                        <div
                            key={paper.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="hidden md:block h-5 w-5 text-gray-500" />
                                <div>
                                    <div className="flex">
                                        <h4 className="font-medium text-gray-900">{paper.title}</h4>
                                        <span>- ({paper.subject && <span>{paper.subject}</span>})</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
