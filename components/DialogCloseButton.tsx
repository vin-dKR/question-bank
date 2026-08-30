import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useMemo } from "react"
import { useFolderContext } from "@/lib/context/FolderContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function DialogCloseButton({ selectedQuestions }: { selectedQuestions: Pick<Question, 'id'>[] }) {
    const [folderName, setFolderName] = useState<string>("")
    const [mode, setMode] = useState<'new' | 'existing'>("new")
    const [selectedFolderId, setSelectedFolderId] = useState<string>("")
    const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true)
    const { addFolder, getAllFolders, drafts, updateQuestionsInFolder } = useFolderContext()

    const createFolder = async () => {
        if (!folderName.trim() || selectedQuestions.length === 0) {
            return;
        }

        const success = await addFolder(folderName.trim(), selectedQuestions);
        if (success) {
            setFolderName("");
            await getAllFolders()
        } else {
            console.error("Failed to create folder");
        }
    };

    const selectedFolder = useMemo(() => drafts.find((d) => d.id === selectedFolderId), [drafts, selectedFolderId])

    const duplicateStats = useMemo(() => {
        if (!selectedFolder) return null;
        const existingIds = new Set(selectedFolder.questions.map((q) => q.id))
        const selectedIds = selectedQuestions.map((q) => q.id)
        const uniqueSelectedIds = Array.from(new Set(selectedIds))

        const duplicatesCount = uniqueSelectedIds.filter((id) => existingIds.has(id)).length
        const uniqueNewIds = uniqueSelectedIds.filter((id) => !existingIds.has(id))
        const newCountIfDedup = uniqueNewIds.length
        const existingCount = selectedFolder.questions.length

        const totalAfter = removeDuplicates
            ? existingCount + newCountIfDedup
            : existingCount + selectedIds.length

        return {
            existingCount,
            duplicatesCount,
            newCountIfDedup,
            totalAfter,
        }
    }, [selectedFolder, selectedQuestions, removeDuplicates])

    const moveToExistingFolder = async () => {
        if (!selectedFolder || selectedQuestions.length === 0) return

        const existingIds = selectedFolder.questions.map((q) => q.id)
        const selectedIds = selectedQuestions.map((q) => q.id)

        let finalIds: string[]
        if (removeDuplicates) {
            const existingSet = new Set(existingIds)
            const uniqueSelected = Array.from(new Set(selectedIds)).filter((id) => !existingSet.has(id))
            finalIds = [...existingIds, ...uniqueSelected]
        } else {
            finalIds = [...existingIds, ...selectedIds]
        }

        const success = await updateQuestionsInFolder(selectedFolder.id, finalIds.map((id) => ({ id })))
        if (!success) {
            console.error('Failed to move questions to folder')
            return
        }
        await getAllFolders()
    }


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="h-8 w-auto rounded-lg border border-zinc-200 bg-white px-2.5 text-zinc-700 shadow-none hover:bg-zinc-100 hover:text-zinc-900 hover:translate-y-0" size="sm">
                    <span className='text-nowrap text-xs font-semibold'>
                        Save Draft
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white max-h-[100vh] rounded rounded-xl border border-black/20 !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
                <DialogHeader>
                    <DialogTitle>{mode === 'new' ? 'Create New Draft Paper' : 'Add to Existing Draft Paper'}</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-2">
                    <Button
                        type="button"
                        className={`h-8 rounded-lg ${mode === 'new' ? 'bg-indigo-600 text-white border border-black/20' : 'border border-black/20'}`}
                        onClick={() => setMode('new')}
                    >
                        New Draft
                    </Button>
                    <Button
                        type="button"
                        className={`h-8 rounded-lg ${mode === 'new' ? 'border border-black/20' : 'bg-indigo-600 text-white border border-black/20 '}`}
                        onClick={() => setMode('existing')}
                        disabled={drafts.length === 0}
                    >
                        Existing Draft
                    </Button>
                </div>

                {mode === 'new' && (
                    <>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="name">Draft Paper Name</Label>
                                <Input
                                    id="name"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    placeholder="Enter draft paper name"
                                    className="rounded-lg border border-black/20"
                                />
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {selectedQuestions?.length} question(s) will be saved
                        </div>
                        <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                                <Button
                                    onClick={createFolder}
                                    type="button"
                                    disabled={!folderName.trim() || selectedQuestions.length === 0}
                                    className="bg-indigo-600 text-white border border-black/20"
                                >
                                    Create Draft
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </>
                )}

                {mode === 'existing' && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="existing-folder">Choose Draft Paper</Label>
                            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                                <SelectTrigger id="existing-folder" className="border border-black/20">
                                    <SelectValue placeholder={drafts.length ? "Select a draft paper" : "No draft papers available"} />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-black border border-black/20">
                                    {drafts.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox id="remove-duplicates" checked={removeDuplicates} onCheckedChange={(v) => setRemoveDuplicates(Boolean(v))} />
                            <Label htmlFor="remove-duplicates">Remove duplicates</Label>
                        </div>

                        {selectedFolder && duplicateStats && (
                            <div className="text-sm text-muted-foreground space-y-1 pt-2 border-y border-black/30 pb-1">
                                <div><span className="font-medium">Selected:</span> {selectedQuestions.length}</div>
                                <div><span className="font-medium">Existing in draft:</span> {duplicateStats.existingCount}</div>
                                <div><span className="font-medium">Duplicates among selected vs draft:</span> {duplicateStats.duplicatesCount}</div>
                                <div><span className="font-medium">New to add{removeDuplicates ? " (deduped)" : " (including duplicates)"}:</span> {removeDuplicates ? duplicateStats.newCountIfDedup : selectedQuestions.length}</div>
                                <div><span className="font-medium">Total after adding:</span> {duplicateStats.totalAfter}</div>
                            </div>
                        )}

                        <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                                <Button
                                    onClick={moveToExistingFolder}
                                    type="button"
                                    disabled={!selectedFolderId || selectedQuestions.length === 0}
                                    className="bg-indigo-600 text-white border border-black/30"
                                >
                                    Add to Draft
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
