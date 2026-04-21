export function RecentPapersSkeleton() {
    return (
        <div className="md:col-span-1 rounded-xl border border-black/5 bg-white p-6 shadow-xs mt-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-32 bg-zinc-200 rounded" />
                <div className="h-6 w-16 bg-zinc-200 rounded" />
            </div>
            <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg"
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="hidden md:block h-4 w-4 bg-zinc-200 rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/5 bg-zinc-200 rounded" />
                                <div className="h-2.5 w-2/5 bg-zinc-200 rounded" />
                            </div>
                        </div>
                        <div className="h-6 w-6 bg-zinc-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
