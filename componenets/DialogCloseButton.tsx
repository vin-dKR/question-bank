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
import { useState } from "react"
import { useFolderContext } from "@/lib/context/FolderContext"

export function DialogCloseButton({ selectedQuestions }: { selectedQuestions: Pick<Question, 'id'>[] }) {
    const [folderName, setFolderName] = useState<string>("")
    const { addFolder, getAllFolders } = useFolderContext()

    const createFolder = async () => {
        if (!folderName.trim() || selectedQuestions.length === 0) {
            return;
        }

        const success = await addFolder(folderName.trim(), selectedQuestions);
        if (success) {
            console.log("Folder created successfully");
            setFolderName("");
            await getAllFolders()
        } else {
            console.error("Failed to create folder");
        }
    };


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Save to Folder</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="name">Folder Name</Label>
                        <Input
                            id="name"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Enter folder name"
                        />
                    </div>
                </div>
                <div className="text-sm text-muted-foreground">
                    {selectedQuestions.length} question(s) will be saved
                </div>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button
                            onClick={createFolder}
                            type="button"
                            disabled={!folderName.trim() || selectedQuestions.length === 0}
                            className="bg-indigo-600 text-white"
                        >
                            Create Folder
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

