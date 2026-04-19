import { QuestionsCountSkeleton } from "@/components/dashboard/skeletons/QuestionsCountSkeleton";
import { RecentPapersSkeleton } from "@/components/dashboard/skeletons/RecentPapersSkeleton";

export default function Loading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuestionsCountSkeleton />
            <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-9 w-20 bg-gray-200 rounded mt-3" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded mt-3" />
                <div className="h-9 w-32 bg-gray-300 rounded mt-4" />
            </div>
            <RecentPapersSkeleton />
        </div>
    );
}
