"use client";

/**
 * PPT Templates: the saved layouts, plus the editor for building new ones.
 *
 * Starting points come from the built-in presets so a teacher never faces an empty
 * canvas — pick one, then move the boxes around.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CirclePlus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import SlideTemplateEditor from "./SlideTemplateEditor";
import SlideCanvas from "./SlideCanvas";
import { PRESETS, getTheme } from "@/lib/slides/presets";
import {
    deleteSlideTemplate,
    listSlideTemplates,
    type StoredSlideTemplate,
} from "@/actions/slides/slideTemplates";

export default function SlideTemplatePage() {
    const [templates, setTemplates] = useState<StoredSlideTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<StoredSlideTemplate | "new" | null>(null);
    const [pendingDelete, setPendingDelete] = useState<StoredSlideTemplate | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await listSlideTemplates();
        setLoading(false);
        if (!res.success) {
            toast.error(res.error);
            return;
        }
        setTemplates(res.data);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const startFromPreset = (presetId: string) => {
        const theme = getTheme("midnight");
        const preset = PRESETS(theme).find((p) => p.id === presetId);
        if (!preset) return;
        setEditing({
            id: "",
            name: preset.name,
            themeId: theme.id,
            slides: preset.slides,
            updatedAt: "",
        });
    };

    const onDelete = async () => {
        if (!pendingDelete) return;
        const res = await deleteSlideTemplate(pendingDelete.id);
        setPendingDelete(null);
        if (!res.success) {
            toast.error(res.error);
            return;
        }
        toast.success("Template deleted.");
        load();
    };

    if (editing) {
        // A preset-seeded template carries an empty id, which saveSlideTemplate
        // treats as "create" — so presets and blank templates both become new rows,
        // while an existing template updates in place.
        return (
            <div className="p-4 md:p-6">
                <SlideTemplateEditor
                    initial={editing === "new" ? undefined : editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        load();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900">PPT Templates</h1>
                    <p className="text-sm text-zinc-500">
                        Design where the question, options and blank space sit on each slide.
                    </p>
                </div>
                <Button onClick={() => setEditing("new")}>
                    <CirclePlus className="size-4" />
                    New template
                </Button>
            </div>

            {/* Starting points */}
            <div className="space-y-2">
                <h2 className="text-sm font-medium text-zinc-700">Start from a layout</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {PRESETS(getTheme("midnight")).map((p) => (
                        <Card
                            key={p.id}
                            className="cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden py-0"
                            onClick={() => startFromPreset(p.id)}
                        >
                            <CardContent className="p-3 space-y-2">
                                <div className="pointer-events-none rounded overflow-hidden">
                                    <SlideCanvas
                                        slide={p.slides[0]}
                                        selectedId={null}
                                        onSelect={() => {}}
                                        onChange={() => {}}
                                        width={320}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-800">{p.name}</div>
                                    <p className="text-xs text-zinc-500">{p.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Saved */}
            <div className="space-y-2">
                <h2 className="text-sm font-medium text-zinc-700">Your templates</h2>

                {loading ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-48 rounded-lg" />
                        ))}
                    </div>
                ) : templates.length === 0 ? (
                    <p className="text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg p-6 text-center">
                        No saved templates yet. Pick a layout above to get started.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {templates.map((t) => (
                            <Card key={t.id} className="overflow-hidden py-0">
                                <CardContent className="p-3 space-y-2">
                                    <div className="pointer-events-none rounded overflow-hidden">
                                        <SlideCanvas
                                            slide={t.slides[0]}
                                            selectedId={null}
                                            onSelect={() => {}}
                                            onChange={() => {}}
                                            width={320}
                                            readOnly
                                        />
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-zinc-800 truncate">
                                                {t.name}
                                            </div>
                                            <p className="text-xs text-zinc-500">
                                                {t.slides.length} slide{t.slides.length > 1 ? "s" : ""} ·{" "}
                                                {t.slides.filter((s) => s.repeat).length} per question
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setEditing(t)}
                                                title="Edit"
                                            >
                                                <Edit className="size-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setPendingDelete(t)}
                                                title="Delete"
                                            >
                                                <Trash2 className="size-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete template?</DialogTitle>
                        <DialogDescription>
                            &quot;{pendingDelete?.name}&quot; will be removed. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={onDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
