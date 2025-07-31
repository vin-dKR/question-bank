'use client';

import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorMessageProps {
    error?: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
    if (!error) return null;

    return (
        <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
}
