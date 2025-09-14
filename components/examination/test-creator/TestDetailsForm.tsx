import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TestCreatorAction } from '@/hooks/reducer/useTestCreatorReducer';

interface TestDetailsFormProps {
    testData: CreateTestData;
    dispatch: (action: TestCreatorAction) => void;
}

export default function TestDetailsForm({ testData, dispatch }: TestDetailsFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Test Title</label>
                        <Input
                            className="border border-black/30"
                            value={testData.title}
                            onChange={(e) => dispatch({ type: 'SET_TEST_FIELD', field: 'title', value: e.target.value })}
                            placeholder="Enter test title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Subject</label>
                        <Select
                            value={testData.subject}
                            onValueChange={(value) => dispatch({ type: 'SET_TEST_FIELD', field: 'subject', value })}
                        >
                            <SelectTrigger className="border-black/30">
                                <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-black/10">
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="Physics">Physics</SelectItem>
                                <SelectItem value="Chemistry">Chemistry</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                        <Input
                            className="border border-black/30"
                            type="number"
                            value={testData.duration}
                            onChange={(e) => dispatch({ type: 'SET_TEST_FIELD', field: 'duration', value: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                            min="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Total Marks</label>
                        <Input
                            type="number"
                            value={testData.totalMarks}
                            disabled
                            className="bg-gray-50 border border-black/30"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                        value={testData.description}
                        onChange={(e) => dispatch({ type: 'SET_TEST_FIELD', field: 'description', value: e.target.value })}
                        placeholder="Enter test description"
                        rows={3}
                        className="border-black/30"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
