import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionsCountCard } from "@/components/dashboard/QuestionsCountCard";
import { RecentPapersCard } from "@/components/dashboard/RecentPapersCard";
import { QuestionsCountSkeleton } from "@/components/dashboard/skeletons/QuestionsCountSkeleton";
import { RecentPapersSkeleton } from "@/components/dashboard/skeletons/RecentPapersSkeleton";

export const dynamic = "force-dynamic";

export default function Dashboard() {
    const activeUsers = 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Suspense fallback={<QuestionsCountSkeleton />}>
                <QuestionsCountCard />
            </Suspense>
            <div className="rounded-xl border border-black/5 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-medium text-zinc-500">Active Users</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{activeUsers}</p>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-medium text-zinc-500">Quick Actions</h3>
                <p className="mt-1 text-sm text-zinc-600">Add a new question or category</p>
                <Button asChild className="mt-4">
                    <Link href="/post">Add Question</Link>
                </Button>
            </div>
            <Suspense fallback={<RecentPapersSkeleton />}>
                <RecentPapersCard />
            </Suspense>
        </div>
    );
}
