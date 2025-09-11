import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function EmptyQuestionsCard() {
    return (
        <Card>
            <CardContent className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                    No questions added yet. Select questions from the question bank, add from drafts, or click &quot;Add Question&quot; to get started.
                </p>
            </CardContent>
        </Card>
    );
}
