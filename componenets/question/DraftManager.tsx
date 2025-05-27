import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useFolderContext } from '@/lib/context/FolderContext';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import PDFGenerator from '../pdf/pdfPreview';
import { Input } from '@/components/ui/input';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import AnswerPDFGenerator from '../pdf/AnswerPdfGenerator';
import { renderMixedLatex } from '@/lib/render-tex';


const DraftManager = () => {
    const {
        getAllFolders,
        delFolder,
        renameDrafts,
        updateQuestionsInFolder,
        drafts,
        loading,
        err,
    } = useFolderContext();
    const { selectedQuestions } = useQuestionBankContext();
    const [selectedFolder, setSelectedFolder] = useState<FetchDraft | null>(null);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const { options, institution } = usePDFGeneratorContext()


    const refreshFolders = async () => {
        console.log('Refreshing folders');
        await getAllFolders();
    };

    //console.log('.............................', selectedQuestions);

    useEffect(() => {
        refreshFolders();
    }, []);

    const handleFolderClick = (draft: FetchDraft) => {
        setSelectedFolder(draft);
        setEditMode(null);
    };

    const handleBackToList = () => {
        setSelectedFolder(null);
    };

    const handleRenameFolder = async (id: string, name: string) => {
        try {
            await renameDrafts(id, name);
            if (selectedFolder?.id === id) {
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
            await delFolder(id);
            await refreshFolders();
            if (selectedFolder?.id === id) {
                setSelectedFolder(null);
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
        }
    };


    const handleAddQuestionsToFolder = async () => {
        if (!selectedFolder || selectedQuestions.length === 0) {
            alert('No questions selected or no folder selected');
            return;
        }
        try {
            await updateQuestionsInFolder(
                selectedFolder.id,
                selectedQuestions.map((q) => {
                    return {
                        id: q.id
                    }
                })
            );
            setSelectedFolder((prev) => ({
                ...prev!,
                questions: [
                    ...prev!.questions,
                    ...selectedQuestions.map((q) => ({
                        id: q.id,
                        question_number: q.question_number,
                        question_text: q.question_text,
                        options: q.options,
                        answer: q.answer,
                        subject: q.subject,
                        exam_name: q.exam_name,
                        chapter: q.chapter,
                        file_name: q.file_name || null,
                        isQuestionImage: q.isQuestionImage || false,
                        question_image: q.question_image || null,
                        isOptionImage: q.isOptionImage || false,
                        option_images: q.option_images || null,
                        section_name: q.section_name || null,
                        question_type: q.question_type || null,
                        topic: q.topic || null,
                        folderId: selectedFolder.id,
                        folder: null,
                    })),
                ],
            }));
            await refreshFolders();
        } catch (error) {
            console.error('Failed to add questions:', error);
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
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                            ← Back to folders
                        </Button>
                        <div className="flex flex-wrap gap-1 h-full items-center">
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
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteFolder(selectedFolder.id)}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Delete
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50">
                                        Add Questions
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
                                    <DialogHeader>
                                        <DialogTitle>Add Questions to {selectedFolder.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="text-sm text-slate-600">
                                        {selectedQuestions.length} question(s) will be added
                                    </div>
                                    <DialogFooter className="sm:justify-start">
                                        <DialogClose asChild>
                                            <Button
                                                onClick={handleAddQuestionsToFolder}
                                                disabled={selectedQuestions.length === 0}
                                                className="bg-indigo-600 hover:bg-indigo-700 "
                                            >
                                                Add Questions
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            {selectedFolder.questions.length > 0 && (
                                <div className='flex gap-1'>
                                    <PDFGenerator
                                        institution={institution}
                                        selectedQuestions={selectedFolder.questions}
                                        options={options}
                                    />
                                    <AnswerPDFGenerator
                                        institution={institution}
                                        selectedQuestions={selectedFolder.questions}
                                        options={options}
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

                    <h3 className="text-lg font-medium mb-3 text-slate-800 sm:text-xl">{selectedFolder.name}</h3>

                    <div className="mt-4">
                        {selectedFolder.questions.length > 0 ? (
                            <ul className="space-y-3">
                                {selectedFolder.questions.map((question) => (
                                    <li
                                        key={question.id}
                                        className="p-3 bg-slate-50 rounded-md border border-slate-200 shadow-sm"
                                    >
                                        <p className="text-sm font-medium text-slate-800 sm:text-base">
                                            Q: {renderMixedLatex(question.question_text)}
                                        </p>
                                        <span className="text-xs text-slate-600 sm:text-xs mt-2 bg-white px-2 py-1 rounded-md">
                                            {question.subject || 'No subject'} • {question.exam_name || 'No exam'} •{' '}
                                            {question.chapter || 'No chapter'} • Answer: {question.answer}
                                        </span>
                                        {question.question_image && (
                                            <img
                                                src={question.question_image}
                                                alt="Question"
                                                className="mt-2 w-full max-w-[200px] sm:max-w-[300px] h-auto rounded-md"
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-500 text-sm sm:text-base">No questions in this folder</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {drafts?.length ? (
                        drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                </div>
            )}
        </div>
    );
};

export default DraftManager;
