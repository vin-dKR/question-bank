'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart3, Users, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getTests, TestWithQuestions } from '@/actions/examination/test';

interface Test {
  id: string;
  title: string;
  description?: string | null;
  subject: string;
  duration: number;
  totalMarks: number;
  createdAt: Date;
  _count: {
    responses: number;
  };
}

export default function TestDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await getTests();
      setTests(data);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      Mathematics: 'bg-blue-100 text-blue-800',
      Physics: 'bg-purple-100 text-purple-800',
      Chemistry: 'bg-green-100 text-green-800',
      Biology: 'bg-emerald-100 text-emerald-800',
      English: 'bg-orange-100 text-orange-800',
      History: 'bg-red-100 text-red-800',
      Geography: 'bg-indigo-100 text-indigo-800',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage and analyze your examination tests</p>
        </div>
        <Link href="/examination/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Test
          </Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests created yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first examination test</p>
            <Link href="/examination/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Test
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{test.title}</CardTitle>
                    <Badge className={getSubjectColor(test.subject)}>
                      {test.subject}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {test.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{test.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span>{test.totalMarks} marks</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{test._count.responses} responses</span>
                </div>

                <div className="text-xs text-gray-500">
                  Created {formatDate(test.createdAt.toISOString())}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/examination/analytics/${test.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
