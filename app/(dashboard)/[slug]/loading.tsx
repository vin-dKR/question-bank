export default function Loading() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 animate-pulse">
            <aside className="col-span-1 lg:col-span-2 xl:col-span-2 space-y-4">
                <div className="bg-white rounded-lg p-4 space-y-3 shadow-sm">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded" />
                    ))}
                </div>
                <div className="bg-white rounded-lg p-4 space-y-3 shadow-sm">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded" />
                    ))}
                </div>
            </aside>
            <main className="col-span-1 lg:col-span-4 xl:col-span-6 space-y-4">
                <div className="h-10 w-full bg-gray-200 rounded" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
                        <div className="h-4 w-1/3 bg-gray-200 rounded" />
                        <div className="h-3 w-full bg-gray-200 rounded" />
                        <div className="h-3 w-5/6 bg-gray-200 rounded" />
                    </div>
                ))}
            </main>
        </div>
    );
}
