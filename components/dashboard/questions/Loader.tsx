const Loader = () => {
    return (
        <div className="flex items-center justify-center">
            <div className="p-3 sm:p-4 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm flex items-center justify-center text-sm sm:text-base">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700 mr-2"></div>
                Loading questions...
            </div>
        </div>
    )
}

export default Loader
