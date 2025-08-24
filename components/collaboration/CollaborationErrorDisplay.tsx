'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CollaborationError, COLLABORATION_ERROR_MESSAGES } from '@/types/collaboration-errors';
import { AlertTriangle, RefreshCw, Copy, Home, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface CollaborationErrorDisplayProps {
    error: CollaborationError;
    onRetry?: () => void;
    onBrowseFolders?: () => void;
    onRequestAccess?: () => void;
    className?: string;
}

export function CollaborationErrorDisplay({
    error,
    onRetry,
    onBrowseFolders,
    onRequestAccess,
    className = ''
}: CollaborationErrorDisplayProps) {
    const errorConfig = COLLABORATION_ERROR_MESSAGES[error.type];

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied! Share this with the folder owner to request access.');
        }
    };

    const handleContactSupport = () => {
        const subject = encodeURIComponent(`Collaboration Error: ${errorConfig.title}`);
        const body = encodeURIComponent(
            `I'm experiencing an issue with folder collaboration:\n\n` +
            `Error: ${error.message}\n` +
            `Details: ${error.details || 'None'}\n` +
            `Folder ID: ${error.folderId || 'Unknown'}\n` +
            `URL: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}\n\n` +
            `Please help resolve this issue.`
        );

        window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
    };

    const getErrorIcon = () => {
        switch (error.type) {
            case 'AUTHENTICATION_REQUIRED':
                return <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>;
            case 'ACCESS_DENIED':
                return <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>;
            case 'FOLDER_NOT_FOUND':
                return <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>;
            default:
                return <AlertTriangle className="h-5 w-5 text-red-400" />;
        }
    };

    const getErrorColor = () => {
        switch (error.type) {
            case 'AUTHENTICATION_REQUIRED':
                return 'blue';
            case 'ACCESS_DENIED':
                return 'red';
            case 'FOLDER_NOT_FOUND':
                return 'yellow';
            case 'COLLABORATION_UNAVAILABLE':
                return 'orange';
            default:
                return 'red';
        }
    };

    const color = getErrorColor();

    return (
        <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {getErrorIcon()}
                </div>
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium text-${color}-800`}>
                        {errorConfig.title}
                    </h3>
                    <div className={`mt-2 text-sm text-${color}-700`}>
                        <p>{error.message}</p>
                        {error.details && (
                            <div className={`mt-2 text-xs text-${color}-600`}>
                                <p>{error.details}</p>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                            {/* Retry button for retryable errors */}
                            {error.retryable && onRetry && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onRetry}
                                    className={`border-${color}-300 text-${color}-700 hover:bg-${color}-50`}
                                >
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Try Again
                                </Button>
                            )}

                            {/* Browse folders fallback */}
                            {onBrowseFolders && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onBrowseFolders}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    <Home className="w-4 h-4 mr-1" />
                                    Browse My Folders
                                </Button>
                            )}

                            {/* Copy link for access requests */}
                            {error.type === 'ACCESS_DENIED' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy Link
                                </Button>
                            )}

                            {/* Request access button */}
                            {error.actionable && onRequestAccess && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onRequestAccess}
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Mail className="w-4 h-4 mr-1" />
                                    Request Access
                                </Button>
                            )}

                            {/* Contact support for unknown errors */}
                            {error.type === 'UNKNOWN_ERROR' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleContactSupport}
                                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                    <Mail className="w-4 h-4 mr-1" />
                                    Contact Support
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Additional help text based on error type */}
                    <div className={`mt-3 text-xs text-${color}-600`}>
                        {error.type === 'ACCESS_DENIED' && (
                            <div className="space-y-1">
                                <p>• You may need to be invited to this folder by the owner</p>
                                <p>• Your invitation may have been revoked or expired</p>
                                <p>• Try signing in with a different account if you have multiple</p>
                            </div>
                        )}
                        {error.type === 'FOLDER_NOT_FOUND' && (
                            <div className="space-y-1">
                                <p>• The folder may have been deleted by the owner</p>
                                <p>• The collaboration link may be incorrect or outdated</p>
                                <p>• Check if you received the link correctly</p>
                            </div>
                        )}
                        {error.type === 'AUTHENTICATION_REQUIRED' && (
                            <div className="space-y-1">
                                <p>• You need to sign in to access shared content</p>
                                <p>• Make sure you&apos;re using the correct account</p>
                                <p>• The link will work after you sign in</p>
                            </div>
                        )}
                        {error.type === 'INVALID_FOLDER_ID' && (
                            <div className="space-y-1">
                                <p>• The collaboration link appears to be malformed</p>
                                <p>• Try requesting a new link from the folder owner</p>
                                <p>• Check if the link was copied correctly</p>
                            </div>
                        )}
                        {error.type === 'COLLABORATION_UNAVAILABLE' && (
                            <div className="space-y-1">
                                <p>• This is likely a temporary issue</p>
                                <p>• Your own folders should still be accessible</p>
                                <p>• Try again in a few minutes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact version for inline display
export function CollaborationErrorInline({
    error,
    onRetry,
    className = ''
}: {
    error: CollaborationError;
    onRetry?: () => void;
    className?: string;
}) {
    const errorConfig = COLLABORATION_ERROR_MESSAGES[error.type];

    return (
        <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
            <AlertTriangle className="w-4 h-4" />
            <span>{errorConfig.title}: {error.message}</span>
            {error.retryable && onRetry && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRetry}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                    Retry
                </Button>
            )}
        </div>
    );
}
