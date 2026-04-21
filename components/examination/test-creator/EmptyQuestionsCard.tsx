import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmptyQuestionsCard() {
    return (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 px-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
                <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-zinc-900">No questions added yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Pick from your question bank, load a draft, or use School Test to extract questions from a paper.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                    <Link href="/drafts">From Drafts</Link>
                </Button>
                <Button size="sm" asChild>
                    <Link href="/questions">From Bank</Link>
                </Button>
            </div>
        </div>
    );
}
