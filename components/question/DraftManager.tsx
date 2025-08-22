"use client"
import Image from 'next/image';
import { StepBack, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import PDFGenerator from '../pdf/pdfPreview';
import { renderMixedLatex } from '@/lib/render-tex';
import { useFolderContext } from '@/lib/context/FolderContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { useCollaboration } from '@/lib/context/CollaborationContext';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { checkFolderAccess } from '@/actions/collaboration/folder';
import { updateFolderQuestionsWithOrder } from '@/actions/collaboration/folder';
import Link from 'next/link';
import { toast } from 'sonner';

interface DraftManagerProps {
    previewLimit?: number;
}

const DraftManager = ({ previewLimit }: DraftManagerProps) => {
    const {
        getAllFolders,
        delFolder,
        renameDrafts,
        removeQuestionFromFolder,
        drafts,
        loading,
        err,
    } = useFolderContext();
    const [selectedFolder, setSelectedFolder] = useState<FetchDraft | null>(null);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const { options, institution } = usePDFGeneratorContext();
    const [questionToRemove, setQuestionToRemove] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
    const { joinFolder, leaveFolder, sendMessage, currentFolderId, isConnected } = useCollaboration();
    
    const refreshFolders = async () => {
        await getAllFolders();
    };

    useEffect(() => {
        console.log("refreshing folders")
        refreshFolders();
    }, []);

    // Join collaboration when folder is selected (only in full view)
    useEffect(() => {
        if (selectedFolder && !previewLimit) {
            // Only join if we're not already connected to this folder
            if (currentFolderId !== selectedFolder.id || !isConnected) {
                console.log('Joining folder:', selectedFolder.id);
                joinFolder(selectedFolder.id);
            }
            // Check user's role for this folder
            checkFolderAccess(selectedFolder.id).then((result) => {
                if (result.success && result.data?.role) {
                    setUserRole(result.data.role);
                }
            });
        } else if (selectedFolder && previewLimit) {
            // In preview mode, just check access without joining collaboration
            checkFolderAccess(selectedFolder.id).then((result) => {
                if (result.success && result.data?.role) {
                    setUserRole(result.data.role);
                }
            });
        } else if (!selectedFolder) {
            // Only leave if we're currently connected to a folder
            if (isConnected) {
                console.log('Leaving folder');
                leaveFolder();
            }
        }

        return () => {
            // Only cleanup on unmount, not on every effect run
        };
    }, [selectedFolder?.id, previewLimit, currentFolderId, isConnected, joinFolder, leaveFolder]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isConnected) {
                console.log('Component unmounting, leaving folder');
                leaveFolder();
            }
        };
    }, [isConnected, leaveFolder]);

    const handleFolderClick = (draft: FetchDraft) => {
        setSelectedFolder(draft);
        setEditMode(null);
    };

    const handleBackToList = () => {
        setSelectedFolder(null);
    };

    const handleRenameFolder = async (id: string, name: string) => {
        try {
            const success = await renameDrafts(id, name);
            if (success && selectedFolder?.id === id) {
                setSelectedFolder((prev) => (prev ? { ...prev, name } : null));
            }
            setEditMode(null);
            setNewName('');
            await refreshFolders();
        } catch (error) {
            console.error('Failed to rename folder:', error);
        }
    };

    const handleDeleteFolder = async (id: string) => {
        try {
            const success = await delFolder(id);
            if (success && selectedFolder?.id === id) {
                setSelectedFolder(null);
            }
            await refreshFolders();
        } catch (error) {
            console.error('Failed to delete folder:', error);
        }
    };

    const handleRemoveQuestion = async (questionId: string) => {
        if (!selectedFolder) return;
        const originalQuestions = [...selectedFolder.questions];

        try {
            // Optimistic update
            setSelectedFolder((prev) => ({
                ...prev!,
                questions: prev!.questions.filter((q) => q.id !== questionId),
            }));

            const success = await removeQuestionFromFolder(selectedFolder.id, questionId);
            if (!success) {
                throw new Error('Failed to remove question');
            }
            await refreshFolders();
            setQuestionToRemove(null);
        } catch (error) {
            console.error('Failed to remove question:', error);
            // Revert on failure
            setSelectedFolder((prev) => ({
                ...prev!,
                questions: originalQuestions,
            }));
            alert('Failed to remove question');
        }
    };

    const handleSaveOrder = async () => {
        if (!selectedFolder) return;
        
        try {
            const success = await updateFolderQuestionsWithOrder(
                selectedFolder.id,
                selectedFolder.questions.map((q) => q.id)
            );
            
            if (success.success) {
                toast.success('Question order saved successfully');
                await refreshFolders();
                
                // Notify other collaborators
                sendMessage({
                    type: 'update',
                    folderId: selectedFolder.id,
                    userId: 'current',
                    userName: 'You',
                    data: { action: 'reorder', questionCount: selectedFolder.questions.length }
                });
            } else {
                toast.error(success.error || 'Failed to save order');
            }
        } catch (error) {
            console.error('Failed to save order:', error);
            toast.error('Failed to save question order');
        }
    };

    if (loading) return <div>Loading folders...</div>;
    if (err) return <div className="text-red-500">Error: {err}</div>;

    return (
        <div className="w-full">
            {selectedFolder ? (
                <div className="bg-white p-2 sm:p-6 rounded-lg shadow-md border border-slate-200 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToList}
                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-black/5"
                        >
                            <StepBack />
                            Back to folders
                        </Button>

                        <div className="flex flex-wrap gap-2 h-full items-center">
                            {userRole !== 'viewer' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditMode(selectedFolder.id);
                                        setNewName(selectedFolder.name);
                                    }}
                                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                                >
                                    Rename
                                </Button>
                            )}
                            {userRole === 'owner' && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteFolder(selectedFolder.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Delete
                                </Button>
                            )}

                            {selectedFolder.questions.length > 0 && (
                                <div className="flex gap-1">
                                    <PDFGenerator
                                        institution={institution}
                                        selectedQuestions={selectedFolder.questions}
                                        options={options}
                                        className=""
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {editMode === selectedFolder.id && (
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <Input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 border-slate-200 focus:ring-amber-500 focus:border-amber-500 text-sm sm:text-base"
                                autoFocus
                            />
                            <Button
                                onClick={() => handleRenameFolder(selectedFolder.id, newName)}
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                            >
                                Save
                            </Button>
                            <Button
                                onClick={() => setEditMode(null)}
                                size="sm"
                                variant="outline"
                                className="border-slate-500 text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <h3 className="text-lg font-medium mb-3 text-slate-800 sm:text-xl">{selectedFolder.name}</h3>

                            <div className="mt-4">
                                {selectedFolder.questions.length > 0 ? (
                                    <div>
                                        <div className="flex w-full justify-between items-center mb-2">
                                            <span className='text-black/50'>
                                                Drag to order the questions
                                            </span>

                                            {userRole !== 'viewer' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-500 hover:bg-emerald-600"
                                                    onClick={handleSaveOrder}
                                                >
                                                    Save Order
                                                </Button>
                                            )}
                                        </div>
                                        <ul className="space-y-3">
                                            {selectedFolder.questions.map((question, index) => (
                                                <li
                                                    key={question.id}
                                                    className="p-3 bg-slate-50 rounded-md border border-black/5 flex flex-col gap-2"
                                                    draggable={userRole !== 'viewer'}
                                                    onDragStart={() => setDragIndex(index)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => {
                                                        if (dragIndex === null || dragIndex === index || userRole === 'viewer') return;
                                                        setSelectedFolder((prev) => {
                                                            if (!prev) return prev;
                                                            const newQuestions = [...prev.questions];
                                                            const [moved] = newQuestions.splice(dragIndex, 1);
                                                            newQuestions.splice(index, 0, moved);
                                                            return { ...prev, questions: newQuestions };
                                                        });
                                                        setDragIndex(null);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-medium text-slate-800 sm:text-base">
                                                            Q: {renderMixedLatex(question.question_text)}
                                                        </p>
                                                        {userRole !== 'viewer' && (
                                                            <Dialog
                                                                open={questionToRemove === question.id}
                                                                onOpenChange={(open) =>
                                                                    setQuestionToRemove(open ? question.id : null)
                                                                }
                                                            >
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        className="bg-red-500 hover:bg-red-600 rounded-full h-8 w-8"
                                                                    >
                                                                        <Trash className='h-4 w-4' />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-md bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Remove Question</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="text-sm text-slate-600">
                                                                        Are you sure you want to remove this question from{' '}
                                                                        {selectedFolder.name}?
                                                                    </div>
                                                                    <DialogFooter className="sm:justify-start">
                                                                        <DialogClose asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                className="border-slate-500 text-slate-600 hover:bg-slate-100"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </DialogClose>
                                                                        <Button
                                                                            onClick={() => handleRemoveQuestion(question.id)}
                                                                            className="bg-red-500 hover:bg-red-600"
                                                                        >
                                                                            Remove
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-600 sm:text-xs mt-2 bg-white px-2 py-1 rounded-md">
                                                        {question.subject || 'No subject'} • {question.exam_name || 'No exam'} •{' '}
                                                        {question.chapter || 'No chapter'} • Answer: {question.answer}
                                                    </span>
                                                    {question.question_image && (
                                                        <Image
                                                            src={question.question_image}
                                                            alt="Question"
                                                            className="mt-2 w-full max-w-[200px] sm:max-w-[300px] h-auto rounded-md"
                                                            width={300}
                                                            height={300}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm sm:text-base">No questions in this folder</p>
                                )}
                            </div>
                        </div>

                        {/* Collaboration Panel */}
                        {!previewLimit && (
                            <div className="lg:col-span-1">
                                <CollaborationPanel
                                    folderId={selectedFolder.id}
                                    folderName={selectedFolder.name}
                                    userRole={userRole}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {drafts?.length ? (
                        (previewLimit ? drafts.slice(0, previewLimit) : drafts).map((draft) => (
                            <div
                                key={draft.id}
                                className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => handleFolderClick(draft as FetchDraft)}
                            >
                                <h3 className="text-sm font-medium text-slate-800 sm:text-base">{draft.name}</h3>
                                <p className="text-xs text-slate-600 mt-1 sm:text-sm">
                                    {draft.questions.length} question{draft.questions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm sm:text-base col-span-full">No folders available</p>
                    )}
                    {previewLimit && drafts?.length > previewLimit && (
                        <div className="col-span-full flex justify-end mt-2">
                            <Link href="/drafts" className="text-indigo-600 hover:underline text-sm">View all</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DraftManager;