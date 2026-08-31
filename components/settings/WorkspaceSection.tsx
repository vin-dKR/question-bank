"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateOrganizationName } from "@/actions/organization/settings";
import type { OrgSettings } from "@/actions/organization/types";

/**
 * The institution name, backed by `Organization.name`.
 *
 * This used to be a `useState("")` that started blank and saved nowhere, which
 * is why the name typed during onboarding never showed up here.
 */
export function WorkspaceSection({ org }: { org: OrgSettings }) {
    const [name, setName] = useState(org.name);
    const [saving, setSaving] = useState(false);
    const dirty = name.trim() !== org.name && name.trim().length > 0;

    async function save() {
        setSaving(true);
        const res = await updateOrganizationName(name);
        setSaving(false);
        if (res.success) toast.success("Institution name updated");
        else toast.error("Couldn't save", { description: res.error });
    }

    return (
        <div className="px-6 py-4 space-y-1.5">
            <Label htmlFor="institution" className="text-xs font-medium text-zinc-600">
                Institution name
            </Label>
            <div className="flex items-center gap-2">
                <Input
                    id="institution"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your school or coaching institute"
                    className="max-w-sm"
                    disabled={!org.canManage || saving}
                />
                {org.canManage && (
                    <Button size="sm" onClick={save} disabled={!dirty || saving}>
                        {saving ? "Saving…" : "Save"}
                    </Button>
                )}
            </div>
            <p className="text-xs text-zinc-500 pt-0.5">
                {org.canManage
                    ? "Used on test paper headers and PDFs, and shown to anyone you invite."
                    : "Only an admin can change this."}
            </p>
        </div>
    );
}
