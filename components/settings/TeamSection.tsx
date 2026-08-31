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
import { Mail, UserPlus, X, Clock, Check, Link2, RotateCw, Ban, LogOut } from "lucide-react";
import {
    inviteMember,
    resendInvitation,
    revokeInvitation,
    removeMember,
} from "@/actions/organization/settings";
import { leaveOrganization } from "@/actions/organization/membership";
import type {
    AssignableRole,
    InvitationState,
    OrgInvitation,
    OrgSettings,
} from "@/actions/organization/types";

/**
 * Members + invitations.
 *
 * Students are absent on purpose (doc §3): they're roster rows created by the
 * teacher through the OMR/examination flow, not accounts. Only teachers and
 * admins get invited, which keeps this an ordinary ~dozen-person invite flow
 * rather than a bulk-import problem for classes of 60.
 *
 * Terminal invitations are shown, not hidden. The previous version listed only
 * `pending`, so "they accepted", "it expired" and "I never actually sent it"
 * were the same thing on screen — a row that disappeared. An admin could not
 * tell whether an invitation had worked, and had no way to recover one that
 * hadn't.
 */

const ROLE_LABELS: Record<string, string> = { admin: "Admin", member: "Teacher" };

function roleLabel(role: string | null): string {
    if (!role) return "Teacher";
    return ROLE_LABELS[role] ?? role;
}

function shortDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATE_STYLES: Record<
    InvitationState,
    { label: string; row: string; chip: string; icon: React.ReactNode }
> = {
    pending: {
        label: "Pending",
        row: "bg-amber-50/30",
        chip: "bg-amber-100 text-amber-800",
        icon: <Clock className="h-4 w-4 flex-shrink-0 text-amber-600" />,
    },
    accepted: {
        label: "Accepted",
        row: "",
        chip: "bg-emerald-100 text-emerald-800",
        icon: <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />,
    },
    expired: {
        label: "Expired",
        row: "",
        chip: "bg-zinc-100 text-zinc-600",
        icon: <Clock className="h-4 w-4 flex-shrink-0 text-zinc-400" />,
    },
    revoked: {
        label: "Revoked",
        row: "",
        chip: "bg-zinc-100 text-zinc-600",
        icon: <Ban className="h-4 w-4 flex-shrink-0 text-zinc-400" />,
    },
};

/** One line of explanation per state, so the chip doesn't need interpreting. */
function invitationDetail(inv: OrgInvitation): string {
    const role = roleLabel(inv.role);
    switch (inv.state) {
        case "pending":
            return `Invited as ${role} on ${shortDate(inv.createdAt)} — expires ${shortDate(inv.expiresAt)}`;
        case "accepted":
            return inv.acceptedAt
                ? `Joined as ${role} on ${shortDate(inv.acceptedAt)}`
                : `Joined as ${role}`;
        case "expired":
            return `Invited on ${shortDate(inv.createdAt)}, never accepted`;
        case "revoked":
            return `Invited on ${shortDate(inv.createdAt)}, revoked`;
    }
}

export function TeamSection({ org }: { org: OrgSettings }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<AssignableRole>("member");
    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState<string | null>(null);

    const refresh = () => startTransition(() => router.refresh());

    async function onInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setBusy("invite");
        const res = await inviteMember(email, role);
        setBusy(null);

        if (res.success) {
            toast.success("Invitation sent", { description: `We emailed ${email.trim()}.` });
            setEmail("");
            refresh();
            return;
        }

        // `code` only exists on the duplicate-invite variant, so narrow with
        // `in` rather than reaching for res.code — the union has members without it.
        if ("code" in res && res.code === "already_invited") {
            toast.error("Already invited", {
                description: res.error,
                action: {
                    label: "Resend",
                    onClick: () => void onResend(res.invitationId, email.trim()),
                },
            });
            return;
        }

        toast.error("Couldn't send invitation", { description: res.error });
    }

    async function onResend(id: string, addr: string) {
        setBusy(id);
        const res = await resendInvitation(id);
        setBusy(null);
        if (res.success) {
            toast.success("Invitation resent", { description: `We emailed ${addr} again.` });
            setEmail("");
            refresh();
        } else {
            toast.error("Couldn't resend", { description: res.error });
        }
    }

    async function onCopyLink(inv: OrgInvitation) {
        if (!inv.acceptUrl) return;
        try {
            await navigator.clipboard.writeText(inv.acceptUrl);
            toast.success("Invite link copied", {
                description: `Anyone with this link can join as ${inv.email}. Send it only to them.`,
            });
        } catch {
            // Clipboard needs a secure context and permission; neither is
            // guaranteed. Don't leave the admin with a dead button.
            toast.error("Couldn't copy automatically", { description: inv.acceptUrl });
        }
    }

    async function onRevoke(id: string, addr: string) {
        setBusy(id);
        const res = await revokeInvitation(id);
        setBusy(null);
        if (res.success) {
            toast.success(`Invitation to ${addr} revoked`);
            refresh();
        } else {
            toast.error("Couldn't revoke", { description: res.error });
        }
    }

    async function onLeave() {
        const ok = confirm(
            `Leave ${org.name}?\n\n` +
                `Papers, questions and classes you created stay with ${org.name} — ` +
                `they belong to the institution, not to you. You'll lose access to them.`
        );
        if (!ok) return;
        setBusy("leave");
        const res = await leaveOrganization(org.id);
        setBusy(null);
        if (res.success) {
            // Full load, not router.push: the session was re-minted server-side
            // and the client cache still holds the org being left.
            window.location.href = res.redirectTo;
        } else {
            toast.error("Couldn't leave", { description: res.error });
        }
    }

    async function onRemove(membershipId: string, who: string) {
        if (!confirm(`Remove ${who} from ${org.name}? Anything they created stays.`)) return;
        setBusy(membershipId);
        const res = await removeMember(membershipId);
        setBusy(null);
        if (res.success) {
            toast.success(`${who} removed`);
            refresh();
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
                        <Badge variant="secondary" className="flex-shrink-0 text-xs">
                            {roleLabel(m.role)}
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
                        {/*
                          * Leaving is self-serve and needs no admin. A teacher
                          * who quits a centre shouldn't have to ask that centre
                          * to stop seeing its data, and the centre shouldn't
                          * need the teacher's cooperation either. The server
                          * refuses if they're the last admin, if it's their own
                          * personal workspace, or if it's their only org.
                          */}
                        {m.isYou && org.type !== "personal" && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-shrink-0 text-xs text-zinc-400 hover:text-rose-700"
                                disabled={busy === "leave" || pending}
                                onClick={onLeave}
                            >
                                <LogOut className="mr-1 h-3.5 w-3.5" />
                                {busy === "leave" ? "Leaving…" : "Leave"}
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {/* Invitations, in every state */}
            {org.invitations.length > 0 && (
                <div className="divide-y divide-black/5">
                    {org.invitations.map((inv) => {
                        const style = STATE_STYLES[inv.state];
                        const isBusy = busy === inv.id || pending;
                        return (
                            <div
                                key={inv.id}
                                className={`flex items-center gap-3 px-6 py-3 ${style.row}`}
                            >
                                {style.icon}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-zinc-800">{inv.email}</p>
                                    <p className="truncate text-xs text-zinc-500">
                                        {invitationDetail(inv)}
                                    </p>
                                </div>
                                <span
                                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${style.chip}`}
                                >
                                    {style.label}
                                </span>

                                {org.canManage && inv.state === "pending" && (
                                    <div className="flex flex-shrink-0 items-center">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-zinc-500 hover:text-zinc-900"
                                            disabled={isBusy}
                                            title="Send the same invitation again"
                                            onClick={() => onResend(inv.id, inv.email)}
                                        >
                                            <RotateCw className="mr-1 h-3.5 w-3.5" />
                                            Resend
                                        </Button>
                                        {inv.acceptUrl && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs text-zinc-500 hover:text-zinc-900"
                                                title="Copy the invite link to send yourself"
                                                onClick={() => onCopyLink(inv)}
                                            >
                                                <Link2 className="mr-1 h-3.5 w-3.5" />
                                                Copy link
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-zinc-500 hover:text-rose-700"
                                            disabled={isBusy}
                                            onClick={() => onRevoke(inv.id, inv.email)}
                                        >
                                            Revoke
                                        </Button>
                                    </div>
                                )}

                                {org.canManage &&
                                    (inv.state === "expired" || inv.state === "revoked") && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="flex-shrink-0 text-xs text-zinc-500 hover:text-zinc-900"
                                            disabled={isBusy}
                                            onClick={() => {
                                                setEmail(inv.email);
                                                setRole(
                                                    inv.role === "admin" ? "admin" : "member"
                                                );
                                            }}
                                        >
                                            Invite again
                                        </Button>
                                    )}
                            </div>
                        );
                    })}
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
                        invite — so double-check it before sending. If it doesn&apos;t arrive,
                        use <strong>Resend</strong>, or <strong>Copy link</strong> and send it
                        to them yourself.
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
