import { Bell, Palette, Globe, Users, Shield } from "lucide-react";
import { getOrganizationSettings } from "@/actions/organization/settings";
import { WorkspaceSection } from "@/components/settings/WorkspaceSection";
import { TeamSection } from "@/components/settings/TeamSection";
import { AppearanceRows, NotificationRows } from "@/components/settings/PreferencesSection";

/**
 * Server component so the organization is loaded before anything renders —
 * the institution name is real data now, not a `useState("")` that started
 * blank and forgot whatever you typed.
 */

function Section({
    icon,
    title,
    description,
    badge,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-xs">
            <div className="flex items-start gap-3 border-b border-black/5 px-6 py-4">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h2>
                        {badge && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
                </div>
            </div>
            <div className="divide-y divide-black/5">{children}</div>
        </div>
    );
}

export default async function SettingsPage() {
    const result = await getOrganizationSettings();

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Manage your institution, your team, and your preferences.
                </p>
            </div>

            {result.success ? (
                <>
                    <Section
                        icon={<Globe className="h-4 w-4" />}
                        title="Institution"
                        description="Shown on generated papers and to anyone you invite."
                    >
                        <WorkspaceSection org={result.data} />
                    </Section>

                    <Section
                        icon={<Users className="h-4 w-4" />}
                        title="Team"
                        description={`${result.data.members.length} member${
                            result.data.members.length === 1 ? "" : "s"
                        }${
                            result.data.invitations.length
                                ? `, ${result.data.invitations.length} pending invite${
                                      result.data.invitations.length === 1 ? "" : "s"
                                  }`
                                : ""
                        }. Students don't need accounts — add them to a test roster instead.`}
                    >
                        <TeamSection org={result.data} />
                    </Section>
                </>
            ) : (
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 px-6 py-5">
                    <p className="text-sm font-medium text-rose-900">
                        Couldn&apos;t load your institution
                    </p>
                    <p className="mt-1 text-xs text-rose-700/80">{result.error}</p>
                </div>
            )}

            <Section
                icon={<Palette className="h-4 w-4" />}
                title="Appearance"
                description="Customize how Eduents looks on your device."
                badge="Coming soon"
            >
                <AppearanceRows />
            </Section>

            <Section
                icon={<Bell className="h-4 w-4" />}
                title="Notifications"
                description="Control what we email you about."
                badge="Coming soon"
            >
                <NotificationRows />
            </Section>

            <Section
                icon={<Shield className="h-4 w-4" />}
                title="Privacy & data"
                description="Export or remove your data."
                badge="Coming soon"
            >
                <div className="px-6 py-4">
                    <p className="text-xs text-zinc-500">
                        Data export and bulk deletion aren&apos;t built yet. Ask support and
                        we&apos;ll do it by hand in the meantime.
                    </p>
                </div>
            </Section>
        </div>
    );
}
