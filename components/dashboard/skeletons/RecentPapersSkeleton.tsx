export function RecentPapersSkeleton() {
    return (
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md mt-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-8 w-20 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="hidden md:block h-5 w-5 bg-gray-200 rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/5 bg-gray-200 rounded" />
                                <div className="h-3 w-2/5 bg-gray-200 rounded" />
                            </div>
                        </div>
                        <div className="h-7 w-7 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
