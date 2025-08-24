// Collaboration error types and utilities

export enum CollaborationErrorType {
    FOLDER_NOT_FOUND = 'FOLDER_NOT_FOUND',
    ACCESS_DENIED = 'ACCESS_DENIED',
    AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
    COLLABORATION_UNAVAILABLE = 'COLLABORATION_UNAVAILABLE',
    INVALID_FOLDER_ID = 'INVALID_FOLDER_ID',
    EXPIRED_INVITATION = 'EXPIRED_INVITATION',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface CollaborationError {
    type: CollaborationErrorType;
    message: string;
    details?: string;
    actionable?: boolean;
    retryable?: boolean;
    folderId?: string;
    userId?: string;
}

export const COLLABORATION_ERROR_MESSAGES: Record<CollaborationErrorType, {
    title: string;
    message: string;
    details?: string;
    actionable: boolean;
    retryable: boolean;
}> = {
    [CollaborationErrorType.FOLDER_NOT_FOUND]: {
        title: 'Folder Not Found',
        message: 'The shared folder could not be found. It may have been deleted or the link is invalid.',
        details: 'The folder may have been deleted by the owner or the collaboration link is incorrect.',
        actionable: true,
        retryable: false
    },
    [CollaborationErrorType.ACCESS_DENIED]: {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this folder. Please contact the folder owner for access.',
        details: 'Your collaboration invitation may have been revoked or expired.',
        actionable: true,
        retryable: false
    },
    [CollaborationErrorType.AUTHENTICATION_REQUIRED]: {
        title: 'Sign In Required',
        message: 'Please sign in to access the shared folder.',
        details: 'You need to be authenticated to view collaboration content.',
        actionable: true,
        retryable: true
    },
    [CollaborationErrorType.COLLABORATION_UNAVAILABLE]: {
        title: 'Collaboration Unavailable',
        message: 'Collaboration features are temporarily unavailable. You can still access your own folders.',
        details: 'The collaboration service may be experiencing issues.',
        actionable: false,
        retryable: true
    },
    [CollaborationErrorType.INVALID_FOLDER_ID]: {
        title: 'Invalid Link',
        message: 'The collaboration link appears to be malformed or invalid.',
        details: 'The folder ID in the URL is not in the correct format.',
        actionable: true,
        retryable: false
    },
    [CollaborationErrorType.EXPIRED_INVITATION]: {
        title: 'Invitation Expired',
        message: 'Your collaboration invitation has expired. Please request a new invitation.',
        details: 'Collaboration invitations have a limited validity period.',
        actionable: true,
        retryable: false
    },
    [CollaborationErrorType.NETWORK_ERROR]: {
        title: 'Connection Error',
        message: 'Unable to connect to the collaboration service. Please check your internet connection.',
        details: 'This may be a temporary network issue.',
        actionable: false,
        retryable: true
    },
    [CollaborationErrorType.UNKNOWN_ERROR]: {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred while accessing the folder.',
        details: 'Please try again or contact support if the problem persists.',
        actionable: false,
        retryable: true
    }
};

// Utility function to create collaboration errors
export function createCollaborationError(
    type: CollaborationErrorType,
    customMessage?: string,
    details?: string,
    folderId?: string,
    userId?: string
): CollaborationError {
    const errorConfig = COLLABORATION_ERROR_MESSAGES[type];

    return {
        type,
        message: customMessage || errorConfig.message,
        details: details || errorConfig.details,
        actionable: errorConfig.actionable,
        retryable: errorConfig.retryable,
        folderId,
        userId
    };
}

// Utility function to determine error type from error message
export function determineErrorType(error: string | Error): CollaborationErrorType {
    const errorMessage = typeof error === 'string' ? error.toLowerCase() : error.message.toLowerCase();

    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        return CollaborationErrorType.AUTHENTICATION_REQUIRED;
    }

    if (errorMessage.includes('access denied') || errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
        return CollaborationErrorType.ACCESS_DENIED;
    }

    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        return CollaborationErrorType.FOLDER_NOT_FOUND;
    }

    if (errorMessage.includes('invalid') && errorMessage.includes('folder')) {
        return CollaborationErrorType.INVALID_FOLDER_ID;
    }

    if (errorMessage.includes('expired') || errorMessage.includes('invitation')) {
        return CollaborationErrorType.EXPIRED_INVITATION;
    }

    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        return CollaborationErrorType.NETWORK_ERROR;
    }

    if (errorMessage.includes('collaboration') && errorMessage.includes('unavailable')) {
        return CollaborationErrorType.COLLABORATION_UNAVAILABLE;
    }

    return CollaborationErrorType.UNKNOWN_ERROR;
}

// Utility function to log collaboration errors
export function logCollaborationError(error: CollaborationError, context?: Record<string, any>) {
    const logData = {
        timestamp: new Date().toISOString(),
        errorType: error.type,
        message: error.message,
        details: error.details,
        folderId: error.folderId,
        userId: error.userId,
        context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Collaboration Error:', logData);
    }

    // In production, you would send this to your logging service
    // Example: sendToLoggingService(logData);

    return logData;
}
