export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-32 w-full border-2 border-dashed border-gray-200 rounded" />
                <div className="flex gap-3">
                    <div className="h-9 w-28 bg-gray-200 rounded" />
                    <div className="h-9 w-28 bg-gray-200 rounded" />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
                <div className="h-3 w-4/6 bg-gray-200 rounded" />
            </div>
        </div>
    );
}
