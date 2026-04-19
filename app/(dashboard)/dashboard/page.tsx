import { Suspense } from "react";
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Active Users</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Quick Actions</h3>
                <p className="text-gray-600 mt-2">Add new question or category</p>
                <Button className="mt-4 bg-black text-white">Add Question</Button>
            </div>
            <Suspense fallback={<RecentPapersSkeleton />}>
                <RecentPapersCard />
            </Suspense>
        </div>
    );
}
