"use client"
import Image from 'next/image';
import { StepBack, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useRouter } from 'next/navigation';


const DraftManager = ({ previewLimit }: DraftManagerPropsLimit) => {
    const {
        getAllFolders,
        delFolder,
        renameDrafts,
        removeQuestionFromFolder,
        getFolderById,
        drafts,
        loading,
        err,
    } = useFolderContext();
    const [selectedFolder, setSelectedFolder] = useState<LocalFetchDraft | null>(null);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const { options, institution } = usePDFGeneratorContext();
    const [questionToRemove, setQuestionToRemove] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
    const { joinFolder, leaveFolder, sendMessage, currentFolderId, isConnected } = useCollaboration();

    // URL parameter handling for collaboration links
    const searchParams = useSearchParams();
    const urlFolderId = searchParams.get('folder');
    const [urlFolderProcessed, setUrlFolderProcessed] = useState(false);
    const [urlFolderError, setUrlFolderError] = useState<string | null>(null);
    const [urlFolderLoading, setUrlFolderLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState<boolean>(false)

    const refreshFolders = async () => {
        await getAllFolders();
    };
    const router = useRouter();

    const selectedCount = selectedFolder?.questions.length || 0;


    // Handle URL parameter for collaboration links
    useEffect(() => {
        const handleUrlFolder = async () => {
            // Only process URL folder parameter if:
            // 1. There's a folder ID in the URL
            // 2. We haven't processed it yet
            // 3. We're not in preview mode (collaboration links should work in full view)
            // 4. No folder is currently selected
            if (urlFolderId && !urlFolderProcessed && !previewLimit && !selectedFolder) {
                setUrlFolderProcessed(true);
                setUrlFolderError(null);
                setUrlFolderLoading(true);

                try {
                    // Validate folder ID format (basic validation)
                    if (typeof urlFolderId !== 'string' || urlFolderId.trim().length === 0) {
                        throw new Error('Invalid folder ID format');
                    }

                    console.log('Loading folder from URL parameter:', urlFolderId);

                    // Show loading toast
                    toast.loading('Loading shared folder...', { id: 'url-folder-loading' });

                    // Attempt to load the folder by ID
                    const folder = await getFolderById(urlFolderId.trim());

                    // Dismiss loading toast
                    toast.dismiss('url-folder-loading');

                    if (folder) {
                        // Successfully loaded folder, select it automatically
                        setSelectedFolder(folder);
                        console.log('Successfully loaded folder from collaboration link:', folder.name);

                        // Show success message with role information
                        const roleText = folder.userRole === 'owner' ? 'as owner' :
                            folder.userRole === 'editor' ? 'with edit access' :
                                'with view access';
                        toast.success(`Opened shared folder "${folder.name}" ${roleText}`);
                    } else {
                        // Folder not found or access denied - error is already set in the hook
                        throw new Error('Unable to access the shared folder. It may not exist or you may not have permission to view it.');
                    }
                } catch (error) {
                    // Dismiss loading toast
                    toast.dismiss('url-folder-loading');

                    console.error('Failed to load folder from URL:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to load shared folder';
                    setUrlFolderError(errorMessage);

                    // Show error toast
                    toast.error(errorMessage);
                } finally {
                    setUrlFolderLoading(false);
                }
            }
        };

        // Only run this effect when the component mounts or URL folder ID changes
        handleUrlFolder();
    }, [urlFolderId, urlFolderProcessed, previewLimit, selectedFolder, getFolderById]);

    // Reset URL folder processing when URL parameter changes
    useEffect(() => {
        if (urlFolderId) {
            setUrlFolderProcessed(false);
            setUrlFolderError(null);
        }
    }, [urlFolderId]);

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


    const handleFolderClick = (draft: LocalFetchDraft) => {
        // Convert the draft to LocalFetchDraft format if needed
        const localDraft: LocalFetchDraft = {
            id: draft.id,
            name: draft.name,
            questions: draft.questions || [],
            userRole: draft.userRole || 'owner',
            isCollaborated: draft.isCollaborated || false,
            collaboratorCount: draft.collaboratorCount || 0,
        };
        setSelectedFolder(localDraft);
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
            // Avoid full refresh; local state and context are already updated
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
            // Avoid full refresh; context state already reflects deletion
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
            // Avoid full refresh; optimistic update + context update suffice
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
            setOrderLoading(true)
            const success = await updateFolderQuestionsWithOrder(
                selectedFolder.id,
                selectedFolder.questions.map((q) => q.id)
            );

            if (success.success) {
                toast.success('Question order saved successfully');
                // Avoid full refresh; order is already persisted and reflected locally

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
            setOrderLoading(false)
        } catch (error) {
            console.error('Failed to save order:', error);
            toast.error('Failed to save question order');
        }
    };

    if (loading) return <div>Loading folders...</div>;
    if (err) return <div className="text-red-500">Error: {err}</div>;

    const createTestFromSelected = () => {
        if (selectedCount === 0) {
            alert('Please select at least one question to create a test.');
            return;
        }

        // Prepare the selected questions data for the examination creation page
        const questionsData = selectedFolder?.questions.map((q, index) => ({
            id: q.id,
            questionText: q.question_text,
            options: q.options,
            answer: q.answer || '',
            marks: 1, // Default marks, can be changed in the creation page
            questionNumber: index + 1,
        }));

        // Store the data in sessionStorage for the examination creation page
        sessionStorage.setItem('selectedQuestionsForTest', JSON.stringify(questionsData));

        // Navigate to the examination creation page
        router.push('/examination/create');
    };

    // Show loading state when processing URL folder parameter
    if (urlFolderLoading) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-600">Loading shared folder...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Display URL folder error if present */}
            {urlFolderError && !selectedFolder && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Unable to access shared folder
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{urlFolderError}</p>
                                <div className="mt-2 text-xs text-red-600">
                                    {urlFolderError.includes('permission') && (
                                        <p>• You may need to be invited to this folder by the owner</p>
                                    )}
                                    {urlFolderError.includes('not found') && (
                                        <p>• The folder may have been deleted or the link is incorrect</p>
                                    )}
                                    {urlFolderError.includes('Invalid') && (
                                        <p>• The collaboration link appears to be malformed</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setUrlFolderError(null);
                                            setUrlFolderProcessed(false);
                                            toast.info('Retrying folder access...');
                                        }}
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                        Try Again
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setUrlFolderError(null);
                                            // Refresh folders to ensure we have the latest data
                                            refreshFolders();
                                        }}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        Browse My Folders
                                    </Button>
                                    {urlFolderError.includes('permission') && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                // Copy the collaboration link to clipboard for sharing
                                                navigator.clipboard.writeText(window.location.href);
                                                toast.success('Link copied! Share this with the folder owner to request access.');
                                            }}
                                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                        >
                                            Copy Link
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedFolder ? (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md border border-slate-200 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 flex-wrap">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToList}
                            className="flex items-center gap-1 whitespace-nowrap text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-black/5 self-end sm:self-auto"
                        >
                            <StepBack />
                            <span>Back to folders</span>
                        </Button>

                        {/* Right-side Actions */}
                        <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
                            {userRole !== 'viewer' && (

                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                    >
                                        <Link href="/questions">
                                            Add Questions
                                        </Link>
                                    </Button>
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
                                </>
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

                            <Button
                                size="sm"
                                onClick={createTestFromSelected}
                                disabled={selectedCount === 0}
                                className="bg-green-600 text-white hover:bg-green-700 transition text-md border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Test
                            </Button>

                            {selectedFolder.questions.length > 0 && (
                                <div className="flex gap-1">
                                    <PDFGenerator
                                        saveToHistory={false}
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
                        <div className={previewLimit ? "lg:col-span-3" : "lg:col-span-2"}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <h3 className="text-lg font-medium text-slate-800 sm:text-xl">{selectedFolder.name}</h3>
                                    {/* Show indicator if folder was loaded from collaboration link */}
                                    {urlFolderId === selectedFolder.id && (
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                            Opened via link
                                        </span>
                                    )}
                                </div>

                                {/* Folder permissions and collaboration status */}
                                <div className="flex items-center space-x-2">
                                    {selectedFolder.isCollaborated ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-xs text-blue-600 font-medium">
                                                    {selectedFolder.userRole === 'editor' ? 'Editor Access' : 'View Only'}
                                                </span>
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                Shared Folder
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-xs text-green-600 font-medium">Owner</span>
                                            </div>
                                            {selectedFolder.collaboratorCount > 0 && (
                                                <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                                                    <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                                    </svg>
                                                    <span className="text-xs text-gray-600">{selectedFolder.collaboratorCount} collaborator{selectedFolder.collaboratorCount !== 1 ? 's' : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

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
                                                    className="bg-emerald-500 hover:bg-emerald-600 whitespace-nowrap"
                                                    onClick={handleSaveOrder}
                                                    disabled={orderLoading}
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
                                className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer relative"
                                onClick={() => handleFolderClick(draft)}
                            >
                                {/* Collaboration status indicator */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        {draft.isCollaborated ? (
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-xs text-blue-600 font-medium">
                                                    {draft.userRole === 'editor' ? 'Editor' : 'Viewer'}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-xs text-green-600 font-medium">Owner</span>
                                            </div>
                                        )}
                                    </div>
                                    {draft.collaboratorCount > 0 && (
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                            </svg>
                                            <span className="text-xs text-slate-500">{draft.collaboratorCount}</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-sm font-medium text-slate-800 sm:text-base">{draft.name}</h3>
                                <p className="text-xs text-slate-600 mt-1 sm:text-sm">
                                    {draft.questions.length} question{draft.questions.length !== 1 ? 's' : ''}
                                </p>

                                {/* Access level indicator */}
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        {draft.userRole === 'owner' ? 'Full access' :
                                            draft.userRole === 'editor' ? 'Can edit' :
                                                'View only'}
                                    </span>
                                    {draft.isCollaborated && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            Shared
                                        </span>
                                    )}
                                </div>
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
