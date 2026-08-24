"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * Appearance + notification preferences.
 *
 * NONE OF THIS PERSISTS YET, and the controls are disabled so it can't pretend
 * otherwise. There is no preferences model in the schema, no i18n in the
 * project, and the "test activity" emails these toggles claim
 * to control have never been implemented. A switch that silently discards what
 * you set is worse than one that's visibly not ready.
 *
 * To make it real: add a `UserPreference` model, load it in the settings server
 * component, and save through a server action — the same shape the Workspace
 * and Team sections above already use.
 */

function Toggle({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                checked ? "bg-indigo-600" : "bg-zinc-200"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
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
                {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
            </div>
            <div className="flex-shrink-0">{control}</div>
        </div>
    );
}

export function AppearanceRows() {
    const [language, setLanguage] = useState("en");
    const [theme, setTheme] = useState("light");
    return (
        <>
            <Row
                label="Theme"
                description="Light is currently supported. Dark coming soon."
                control={
                    <Select value={theme} onValueChange={setTheme} disabled>
                        <SelectTrigger className="h-9 w-32 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />
            <Row
                label="Language"
                description="Display language across the product."
                control={
                    <Select value={language} onValueChange={setLanguage} disabled>
                        <SelectTrigger className="h-9 w-32 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />
        </>
    );
}

export function NotificationRows() {
    return (
        <>
            <Row
                label="Product updates"
                description="Occasional announcements about new features."
                control={<Toggle checked disabled />}
            />
            <Row
                label="Test activity"
                description="Alerts when students submit responses to your tests."
                control={<Toggle checked disabled />}
            />
        </>
    );
}
