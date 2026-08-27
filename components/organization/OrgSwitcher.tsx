"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Plus, Search, Users } from "lucide-react";
import { switchOrganization, createOrganization } from "@/actions/organization/membership";
import type { OrgKind } from "@/actions/organization/types";

/**
 * Which institution am I working in?
 *
 * The header used to read the hardcoded word "Workspace" — accurate only while
 * nobody could belong to two institutions. It isn't once a teacher can be at two
 * coaching centres: every folder, paper and class on screen belongs to one of
 * them, and nothing said which.
 */

export type SwitcherOrg = {
    organizationId: string;
    name: string;
    type: string;
    role: string;
    isActive: boolean;
};

/**
 * Keys that are NOT namespaced by organization and therefore survive a switch.
 * Each holds question ids belonging to the org being left.
 *
 * `qb:selectedQuestions` is the dangerous one: a teacher mid-paper who switches
 * would otherwise carry a selection of one institution's questions into the
 * other's paper builder, where the ids resolve to nothing.
 */
const CROSS_ORG_STORAGE_KEYS = [
    "qb:selectedQuestions",
    "qb:showOnlySelected",
    "eduents:recentCommands",
];

/** Show the filter box only once scanning the list stops being instant. */
const SEARCH_THRESHOLD = 6;

function isPersonal(org: SwitcherOrg) {
    return org.type === "personal";
}

/**
 * What to SHOW for an org, which is not always what it is called.
 *
 * A personal workspace is auto-named "<Name>'s workspace" by `personalOrgName`,
 * and that suffix is dead weight in a 240px trigger — it truncates the only part
 * that identifies anything. The "Personal" badge already carries the meaning, so
 * strip it and show the name, as the reference designs do.
 *
 * Only stripped when it is actually there: onboarding RENAMES the personal org
 * to whatever institution the teacher typed, so plenty of personal orgs are
 * called "Delhi Public School" and must be left alone.
 */
function displayName(org: SwitcherOrg) {
    if (!isPersonal(org)) return org.name;
    const stripped = org.name.replace(/['’]s workspace$/i, "").trim();
    return stripped || org.name;
}

/** The muted second line: what this org IS, not what it's called. */
function subtitle(org: SwitcherOrg) {
    if (isPersonal(org)) return "Only you";
    if (org.type === "school") return org.role === "admin" ? "School · Admin" : "School";
    return org.role === "admin" ? "Coaching centre · Admin" : "Coaching centre";
}

/**
 * A deterministic tile colour per organization.
 *
 * Keyed on the id rather than the name so renaming an institution doesn't move
 * it in the list — the colour is a recognition cue, and one that changes is
 * worse than none.
 */
const TILE_COLOURS = [
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-sky-500",
    "bg-violet-500",
];

function tileColour(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return TILE_COLOURS[hash % TILE_COLOURS.length];
}

function OrgTile({ org, size = "sm" }: { org: SwitcherOrg; size?: "sm" | "md" }) {
    const dim = size === "md" ? "h-7 w-7 text-[11px]" : "h-5 w-5 text-[9px]";
    return (
        <span
            className={`flex ${dim} flex-shrink-0 items-center justify-center rounded-md font-semibold text-white ${tileColour(
                org.organizationId
            )}`}
        >
            {displayName(org).trim().charAt(0).toUpperCase() || "?"}
        </span>
    );
}

function KindBadge({ org }: { org: SwitcherOrg }) {
    if (isPersonal(org)) {
        return (
            <span className="flex-shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                Personal
            </span>
        );
    }
    return (
        <span className="flex flex-shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
            <Users className="h-2.5 w-2.5" />
            Team
        </span>
    );
}

export function OrgSwitcher({ orgs }: { orgs: SwitcherOrg[] }) {
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newKind, setNewKind] = useState<OrgKind>("coaching");

    const active = orgs.find((o) => o.isActive) ?? orgs[0];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return orgs;
        return orgs.filter((o) => displayName(o).toLowerCase().includes(q));
    }, [orgs, query]);

    const institutions = filtered.filter((o) => !isPersonal(o));
    const personal = filtered.filter(isPersonal);
    const showSearch = orgs.length >= SEARCH_THRESHOLD;

    /**
     * Everything client-side that is keyed on the OLD org has to go before we
     * navigate, and the navigation has to be a FULL page load.
     *
     * A soft `router.push` would keep the TanStack cache and the React tree
     * alive across a session change, which is how a teacher ends up looking at
     * Centre A's folders under Centre B's name.
     */
    function resetClientStateAndGo(destination: string) {
        queryClient.clear();
        try {
            for (const key of CROSS_ORG_STORAGE_KEYS) localStorage.removeItem(key);
        } catch {
            // Private mode or blocked storage. The cache clear and the full
            // reload below are what actually matter.
        }
        window.location.href = destination;
    }

    async function onSwitch(org: SwitcherOrg) {
        if (org.isActive || busy) return;
        setBusy(true);
        const res = await switchOrganization(org.organizationId);
        if (res.success) {
            resetClientStateAndGo(res.redirectTo);
        } else {
            setBusy(false);
            toast.error("Couldn't switch", { description: res.error });
        }
    }

    async function onCreate() {
        if (!newName.trim() || busy) return;
        setBusy(true);
        const res = await createOrganization(newName, newKind);
        if (res.success) {
            resetClientStateAndGo(res.redirectTo);
        } else {
            setBusy(false);
            toast.error("Couldn't create the institution", { description: res.error });
        }
    }

    function Row({ org }: { org: SwitcherOrg }) {
        return (
            <DropdownMenuItem
                className="gap-2.5 px-2 py-2"
                disabled={busy}
                onClick={() => onSwitch(org)}
            >
                <OrgTile org={org} size="md" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                        {displayName(org)}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500">{subtitle(org)}</p>
                </div>
                <KindBadge org={org} />
                {org.isActive && (
                    <Check className="h-4 w-4 flex-shrink-0 text-zinc-900" strokeWidth={2.5} />
                )}
            </DropdownMenuItem>
        );
    }

    function SectionLabel({ children }: { children: React.ReactNode }) {
        return (
            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {children}
            </p>
        );
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        disabled={busy}
                        aria-label="Switch institution"
                        className="flex max-w-[240px] items-center gap-2 rounded-lg border border-black/8 bg-white px-2 py-1 shadow-xs transition-colors hover:bg-zinc-50 disabled:opacity-60"
                    >
                        {active && <OrgTile org={active} />}
                        <span className="truncate text-[13px] font-medium text-zinc-900">
                            {active ? displayName(active) : "Workspace"}
                        </span>
                        {active && <KindBadge org={active} />}
                        <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" sideOffset={6} className="w-72 p-1.5">
                    {showSearch && (
                        // Radix's menu owns the keyboard for typeahead, so the
                        // keystrokes have to be stopped before they reach it or
                        // typing jumps the selection instead of filtering.
                        <div
                            className="relative mb-1"
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                            <Input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search institutions"
                                className="h-8 border-black/8 pl-8 text-sm"
                            />
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <p className="px-2 py-6 text-center text-xs text-zinc-500">
                            Nothing matches “{query.trim()}”.
                        </p>
                    )}

                    {personal.length > 0 && (
                        <>
                            <SectionLabel>Personal</SectionLabel>
                            {personal.map((o) => (
                                <Row key={o.organizationId} org={o} />
                            ))}
                        </>
                    )}

                    {institutions.length > 0 && (
                        <>
                            <SectionLabel>Institutions</SectionLabel>
                            {institutions.map((o) => (
                                <Row key={o.organizationId} org={o} />
                            ))}
                        </>
                    )}

                    <DropdownMenuSeparator className="my-1.5" />
                    <DropdownMenuItem
                        className="gap-2.5 px-2 py-2"
                        onClick={() => {
                            setOpen(false);
                            setCreateOpen(true);
                        }}
                    >
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-black/15 text-zinc-400">
                            <Plus className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium text-zinc-700">
                            Create an institution
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create an institution</DialogTitle>
                        <DialogDescription>
                            You&apos;ll be its admin, and you can invite colleagues straight
                            away. Nothing moves out of{" "}
                            {active?.name ?? "your current workspace"} — questions, papers and
                            classes stay where they are.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="org-name">Name</Label>
                            <Input
                                id="org-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Sunrise Academy"
                                disabled={busy}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="org-kind">Type</Label>
                            <Select
                                value={newKind}
                                onValueChange={(v) => setNewKind(v as OrgKind)}
                            >
                                <SelectTrigger id="org-kind">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="coaching">Coaching centre</SelectItem>
                                    <SelectItem value="school">School</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setCreateOpen(false)}
                            disabled={busy}
                        >
                            Cancel
                        </Button>
                        <Button onClick={onCreate} disabled={!newName.trim() || busy}>
                            {busy ? "Creating…" : "Create and switch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
