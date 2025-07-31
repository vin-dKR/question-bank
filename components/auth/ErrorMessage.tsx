'use client';

interface ErrorMessageProps {
    error?: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
    if (!error) return null;
    return (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm" role="alert">
            {error}
        </div>
    );
}
