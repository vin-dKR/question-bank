"use client";

import { createContext, useContext } from "react";

/**
 * The active organization, available to client components.
 *
 * Exists for ONE job: putting the org id into every TanStack query key. The
 * switcher already clears the cache and hard-navigates, so this is the second
 * layer — if a reset is ever missed, or a new cache is added that nobody
 * remembers to clear, the worst case degrades to a cache MISS rather than to
 * one institution's data rendering under another's name.
 *
 * Only the local `Organization.id` is exposed. The WorkOS org id stays on the
 * server; a client component has no use for it and it is a join key to the
 * identity provider.
 */

export type ActiveOrg = {
    id: string | null;
    name: string | null;
};

const ActiveOrgContext = createContext<ActiveOrg>({ id: null, name: null });

export function ActiveOrgProvider({
    value,
    children,
}: {
    value: ActiveOrg;
    children: React.ReactNode;
}) {
    return <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>;
}

export function useActiveOrg(): ActiveOrg {
    return useContext(ActiveOrgContext);
}

/**
 * The org id as a query-key segment.
 *
 * Never returns undefined: an undefined segment would make two different orgs
 * produce the same key while the context is still resolving, which is precisely
 * the collision this is here to prevent.
 */
export function useOrgKey(): string {
    return useActiveOrg().id ?? "no-org";
}
