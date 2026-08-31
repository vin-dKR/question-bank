"use client";

import { useEffect, useState } from "react";
import { X, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JoinWelcome as JoinWelcomeData } from "@/actions/organization/joinWelcome";

/**
 * The one screen that tells an invited teacher what just happened.
 *
 * Three things it has to say, in this order:
 *   1. which institution they joined — otherwise "did the invite work?" has no
 *      answer anywhere in the product
 *   2. what they can do there, i.e. their role
 *   3. that their own workspace is untouched. This is the sentence that stops
 *      "joining a centre deleted my question bank" support tickets. It is not
 *      reassurance, it is true: content never moves between organizations.
 *
 * Dismissal is localStorage, keyed by organization. It is a per-device nicety,
 * not state anyone else needs, so it doesn't earn a database column — and the
 * 24-hour window in `getJoinWelcome` already bounds how long it can reappear if
 * they switch browsers.
 */

const DISMISS_PREFIX = "eduents:joined:";

export function JoinWelcome({ welcome }: { welcome: JoinWelcomeData | null }) {
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        if (!welcome) return;
        try {
            setDismissed(
                localStorage.getItem(DISMISS_PREFIX + welcome.organizationId) === "1"
            );
        } catch {
            // Private mode, or site data blocked. Showing it is the right
            // failure — the banner is the only acknowledgement they get.
            setDismissed(false);
        }
    }, [welcome]);

    if (!welcome || dismissed) return null;

    function dismiss() {
        if (!welcome) return;
        setDismissed(true);
        try {
            localStorage.setItem(DISMISS_PREFIX + welcome.organizationId, "1");
        } catch {
            // Non-fatal: it just reappears on the next load, within the window.
        }
    }

    const roleLine =
        welcome.role === "admin"
            ? "You're an admin there, so you can invite people and manage the institution."
            : "You're a teacher there — the institution's question bank, classes and tests are now yours to work with.";

    return (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <PartyPopper className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-950">
                        You&apos;ve joined {welcome.organizationName}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
                        {roleLine}
                        {welcome.personalWorkspaceName && (
                            <>
                                {" "}
                                Your own workspace,{" "}
                                <strong className="font-medium">
                                    {welcome.personalWorkspaceName}
                                </strong>
                                , is untouched — nothing you created moved, and nothing you
                                had was shared with {welcome.organizationName}.
                            </>
                        )}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 text-emerald-700 hover:text-emerald-900"
                    onClick={dismiss}
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
