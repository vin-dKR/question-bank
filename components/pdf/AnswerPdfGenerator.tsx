'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function AnswerPdfGenerator() {
    return (
        <Button disabled variant="secondary">
            <CheckCircle className="mr-2 h-4 w-4" />
            Answer Key (Moved)
        </Button>
    );
}
