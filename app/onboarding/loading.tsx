export default function Loading() {
    return (
        <div className="min-h-[100svh] flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-8 space-y-6 animate-pulse">
                <div className="space-y-2 text-center">
                    <div className="h-7 w-2/3 mx-auto bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-5 space-y-3">
                            <div className="h-10 w-10 bg-gray-200 rounded mx-auto" />
                            <div className="h-4 w-3/4 mx-auto bg-gray-200 rounded" />
                            <div className="h-3 w-full bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
                <div className="h-10 w-32 mx-auto bg-gray-300 rounded" />
            </div>
        </div>
    );
}
