'use client';

import { useQuery } from '@tanstack/react-query';
import { getFolderCollaborators } from '@/actions/collaboration/folder';

/**
 * Query key for the collaborator list of a folder.
 *
 * Exported so that the WebSocket `onMessage` handler (and any mutation
 * success callbacks) can invalidate it via `queryClient.invalidateQueries`
 * without hard-coding the shape in two places.
 */
export const folderCollaboratorsKey = (folderId: string) =>
    ['folder', folderId, 'collaborators'] as const;

/**
 * Fetches the list of collaborators on a folder. Cheap, cacheable — we expect
 * this to be invalidated by the collaboration WS channel whenever a
 * membership event arrives, rather than refetched on a timer.
 *
 * See `lib/context/CollaborationContext.tsx` for the invalidation wiring.
 */
export function useFolderCollaborators(folderId: string | null | undefined) {
    return useQuery({
        queryKey: folderCollaboratorsKey(folderId ?? ''),
        enabled: !!folderId,
        staleTime: 60_000,
        queryFn: async () => {
            if (!folderId) return [];
            const result = await getFolderCollaborators(folderId);
            if (!result.success) {
                throw new Error(result.error || 'Failed to load collaborators');
            }
            return (result.data ?? []) as Array<{
                id: string;
                role: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }>;
        },
    });
}
