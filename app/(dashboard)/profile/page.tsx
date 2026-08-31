"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useUserRole } from "@/hooks/auth/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Calendar,
    Shield,
    KeyRound,
    Loader2,
} from "lucide-react";

export default function ProfilePage() {
    const { user, isLoaded } = useCurrentUser();
    const { role: userRole } = useUserRole();

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
            </div>
        );
    }

    const displayName = user?.fullName || "User";
    const displayEmail = user?.email;
    const initials =
        displayName
            .split(" ")
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join("") || "U";

    // WorkOS sessions carry no arbitrary app metadata the way Clerk's
    // publicMetadata did, so role comes from the database instead.
    const role = userRole || "Member";

    const joinedAt = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "—";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Hero card */}
            <div className="rounded-xl border border-black/5 bg-white p-6 md:p-8 shadow-xs">
                <div className="flex items-start gap-4 md:gap-6">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-4 ring-white shadow-sm">
                        <AvatarImage src={user?.imageUrl} alt={displayName} />
                        <AvatarFallback className="text-xl md:text-2xl font-semibold bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">
                                {displayName}
                            </h1>
                            <Badge variant="secondary" className="text-xs capitalize">
                                {role}
                            </Badge>
                        </div>
                        {displayEmail && (
                            <p className="mt-1 text-sm text-zinc-500 truncate">{displayEmail}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Account details */}
            <div className="rounded-xl border border-black/5 bg-white shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-black/5">
                    <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                        Account details
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Managed through your account provider.
                    </p>
                </div>
                <dl className="divide-y divide-black/5">
                    <Row
                        icon={<Mail className="h-4 w-4 text-zinc-400" />}
                        label="Email"
                        value={displayEmail ?? "—"}
                    />
                    <Row
                        icon={<Shield className="h-4 w-4 text-zinc-400" />}
                        label="Role"
                        value={<span className="capitalize">{role}</span>}
                    />
                    <Row
                        icon={<KeyRound className="h-4 w-4 text-zinc-400" />}
                        label="User ID"
                        value={<span className="font-mono text-xs">{user?.id ?? "—"}</span>}
                    />
                    <Row
                        icon={<Calendar className="h-4 w-4 text-zinc-400" />}
                        label="Member since"
                        value={joinedAt}
                    />
                </dl>
            </div>

            {/* Danger zone */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5">
                <h3 className="text-sm font-semibold text-rose-900">Danger zone</h3>
                <p className="mt-1 text-xs text-rose-700/80">
                    Removing your account is permanent. This cannot be undone.
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                >
                    Delete account
                </Button>
            </div>
        </div>
    );
}

function Row({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 px-6 py-3.5">
            <div className="flex-shrink-0">{icon}</div>
            <dt className="text-xs text-zinc-500 w-28 flex-shrink-0">{label}</dt>
            <dd className="text-sm text-zinc-900 truncate">{value}</dd>
        </div>
    );
}
