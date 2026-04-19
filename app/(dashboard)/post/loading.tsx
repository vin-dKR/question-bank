export default function Loading() {
    return (
        <div className="container mx-auto py-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 space-y-4 animate-pulse">
                <div className="h-7 w-56 bg-gray-200 rounded" />
                <div className="space-y-3">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-10 w-full bg-gray-200 rounded" />
                </div>
                <div className="space-y-3">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-32 w-full bg-gray-200 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 w-full bg-gray-200 rounded" />
                    <div className="h-10 w-full bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-300 rounded mt-2" />
            </div>
        </div>
    );
}
