"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Bell,
    Palette,
    Globe,
    Trash2,
    Download,
    Shield,
} from "lucide-react";

type SectionProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
};

function Section({ icon, title, description, children }: SectionProps) {
    return (
        <div className="rounded-xl border border-black/5 bg-white shadow-xs overflow-hidden">
            <div className="flex items-start gap-3 px-6 py-4 border-b border-black/5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                        {title}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="divide-y divide-black/5">{children}</div>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                checked ? "bg-indigo-600" : "bg-zinc-200"
            }`}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-5" : "translate-x-1"
                }`}
            />
        </button>
    );
}

function Row({
    label,
    description,
    control,
}: {
    label: string;
    description?: string;
    control: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{label}</p>
                {description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                )}
            </div>
            <div className="flex-shrink-0">{control}</div>
        </div>
    );
}

export default function SettingsPage() {
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [testNotifs, setTestNotifs] = useState(true);
    const [collabNotifs, setCollabNotifs] = useState(false);
    const [language, setLanguage] = useState("en");
    const [theme, setTheme] = useState("light");
    const [institution, setInstitution] = useState("");

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">
                    Settings
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Manage your preferences and account settings.
                </p>
            </div>

            {/* Appearance */}
            <Section
                icon={<Palette className="h-4 w-4" />}
                title="Appearance"
                description="Customize how Eduents looks on your device."
            >
                <Row
                    label="Theme"
                    description="Light is currently supported. Dark coming soon."
                    control={
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-32 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="system" disabled>
                                    System (soon)
                                </SelectItem>
                                <SelectItem value="dark" disabled>
                                    Dark (soon)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                <Row
                    label="Language"
                    description="Display language across the product."
                    control={
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-32 h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi" disabled>
                                    हिंदी (soon)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
            </Section>

            {/* Notifications */}
            <Section
                icon={<Bell className="h-4 w-4" />}
                title="Notifications"
                description="Control what we email you about."
            >
                <Row
                    label="Product updates"
                    description="Occasional announcements about new features."
                    control={<Toggle checked={emailUpdates} onChange={setEmailUpdates} />}
                />
                <Row
                    label="Test activity"
                    description="Alerts when students submit responses to your tests."
                    control={<Toggle checked={testNotifs} onChange={setTestNotifs} />}
                />
                <Row
                    label="Collaboration"
                    description="Notify me when teammates edit shared folders."
                    control={<Toggle checked={collabNotifs} onChange={setCollabNotifs} />}
                />
            </Section>

            {/* Workspace */}
            <Section
                icon={<Globe className="h-4 w-4" />}
                title="Workspace"
                description="Workspace-level identity shown on generated papers."
            >
                <div className="px-6 py-4 space-y-1.5">
                    <Label htmlFor="institution" className="text-xs font-medium text-zinc-600">
                        Institution name
                    </Label>
                    <Input
                        id="institution"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Your school or coaching institute"
                        className="max-w-sm"
                    />
                    <p className="text-xs text-zinc-500 pt-0.5">
                        Printed on test paper headers and PDFs.
                    </p>
                </div>
            </Section>

            {/* Privacy & Data */}
            <Section
                icon={<Shield className="h-4 w-4" />}
                title="Privacy & data"
                description="Export or remove your data."
            >
                <Row
                    label="Export all data"
                    description="Download your questions, tests, and history as JSON."
                    control={
                        <Button size="sm" variant="outline">
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Export
                        </Button>
                    }
                />
                <Row
                    label="Delete all papers"
                    description="Permanently removes generated paper history."
                    control={
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Clear
                        </Button>
                    }
                />
            </Section>

            {/* Save bar */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm">
                    Reset
                </Button>
                <Button size="sm">Save changes</Button>
            </div>
        </div>
    );
}
