"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
    error: string;
    onRetry: () => void;
    onBrowseFolders: () => void;
}

export function ErrorDisplay({ error, onRetry, onBrowseFolders }: ErrorDisplayProps) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 mx-2 sm:mx-4">
            <div className="flex items-start">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Unable to access shared folder</h3>
                    <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                        <div className="mt-2 text-xs text-red-600">
                            {error.includes("permission") && <p>• You may need to be invited to this folder by the owner</p>}
                            {error.includes("not found") && <p>• The folder may have been deleted or the link is incorrect</p>}
                            {error.includes("Invalid") && <p>• The collaboration link appears to be malformed</p>}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRetry}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                            Try Again
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onBrowseFolders}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Browse My Folders
                        </Button>
                        {error.includes("permission") && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Link copied! Share this with the folder owner to request access.");
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                                Copy Link
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
