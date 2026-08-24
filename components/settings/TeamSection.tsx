"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, UserPlus, X, Clock } from "lucide-react";
import { inviteMember, revokeInvitation, removeMember } from "@/actions/organization/settings";
import type { AssignableRole, OrgSettings } from "@/actions/organization/types";

/**
 * Members + invitations.
 *
 * Students are absent on purpose (doc §3): they're roster rows created by the
 * teacher through the OMR/examination flow, not accounts. Only teachers and
 * admins get invited, which keeps this an ordinary ~dozen-person invite flow
 * rather than a bulk-import problem for classes of 60.
 */
export function TeamSection({ org }: { org: OrgSettings }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<AssignableRole>("member");
    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState<string | null>(null);

    async function onInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setBusy("invite");
        const res = await inviteMember(email, role);
        setBusy(null);
        if (res.success) {
            toast.success("Invitation sent", { description: `We emailed ${email.trim()}.` });
            setEmail("");
            startTransition(() => router.refresh());
        } else {
            toast.error("Couldn't send invitation", { description: res.error });
        }
    }

    async function onRevoke(id: string, addr: string) {
        setBusy(id);
        const res = await revokeInvitation(id);
        setBusy(null);
        if (res.success) {
            toast.success(`Invitation to ${addr} revoked`);
            startTransition(() => router.refresh());
        } else {
            toast.error("Couldn't revoke", { description: res.error });
        }
    }

    async function onRemove(membershipId: string, who: string) {
        if (!confirm(`Remove ${who} from ${org.name}? Anything they created stays.`)) return;
        setBusy(membershipId);
        const res = await removeMember(membershipId);
        setBusy(null);
        if (res.success) {
            toast.success(`${who} removed`);
            startTransition(() => router.refresh());
        } else {
            toast.error("Couldn't remove", { description: res.error });
        }
    }

    return (
        <>
            {/* Current members */}
            <div className="divide-y divide-black/5">
                {org.members.map((m) => (
                    <div key={m.membershipId} className="flex items-center gap-3 px-6 py-3.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                            {(m.name || m.email || "?").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-900">
                                {m.name || m.email}
                                {m.isYou && <span className="ml-1.5 text-xs text-zinc-400">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-zinc-500">{m.email}</p>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0 text-xs capitalize">
                            {m.role}
                        </Badge>
                        {org.canManage && !m.isYou && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-shrink-0 text-zinc-400 hover:text-rose-700"
                                disabled={busy === m.membershipId || pending}
                                onClick={() => onRemove(m.membershipId, m.name || m.email)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {/* Pending invitations */}
            {org.invitations.length > 0 && (
                <div className="divide-y divide-black/5 bg-amber-50/30">
                    {org.invitations.map((inv) => (
                        <div key={inv.id} className="flex items-center gap-3 px-6 py-3">
                            <Clock className="h-4 w-4 flex-shrink-0 text-amber-600" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-zinc-800">{inv.email}</p>
                                <p className="text-xs text-zinc-500">
                                    Invited — expires{" "}
                                    {new Date(inv.expiresAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </p>
                            </div>
                            {org.canManage && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-shrink-0 text-xs text-zinc-500 hover:text-rose-700"
                                    disabled={busy === inv.id || pending}
                                    onClick={() => onRevoke(inv.id, inv.email)}
                                >
                                    Revoke
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Invite form */}
            {org.canManage ? (
                <form onSubmit={onInvite} className="space-y-2 px-6 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teacher@example.com"
                                className="pl-9"
                                disabled={busy === "invite"}
                            />
                        </div>
                        <Select value={role} onValueChange={(v) => setRole(v as AssignableRole)}>
                            <SelectTrigger className="h-9 w-full text-sm sm:w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Teacher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit" size="sm" disabled={!email.trim() || busy === "invite"}>
                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                            {busy === "invite" ? "Sending…" : "Invite"}
                        </Button>
                    </div>
                    <p className="text-xs text-zinc-500">
                        They&apos;ll get an email from WorkOS. On Gmail and other consumer
                        addresses they must sign up with the <strong>exact</strong> address you
                        invite — so double-check it before sending.
                    </p>
                </form>
            ) : (
                <p className="px-6 py-4 text-xs text-zinc-500">
                    Only an admin can invite or remove people.
                </p>
            )}
        </>
    );
}
