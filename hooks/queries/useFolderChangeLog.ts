'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import {
    getFolderChangeLogPage,
    type FolderChangeLogPage,
} from '@/actions/collaboration/folder';

/**
 * Query key for a folder's change log. Exported for use by the WS
 * invalidation handler in `lib/context/CollaborationContext.tsx`.
 */
export const folderChangeLogKey = (folderId: string) =>
    ['folder', folderId, 'changeLog'] as const;

/**
 * Infinite-query hook over `FolderChangeLog` rows, newest-first. Each page
 * is ~30 items; `nextCursor` is the `createdAt` ISO string of the last item
 * on the previous page (server uses a `createdAt < cursor` filter on the
 * indexed column).
 *
 * Intended to be paired with WS-driven invalidation rather than polling:
 * any folder-activity WS event should invalidate this query key and
 * TanStack Query will refetch the first page with dedupe + SWR semantics.
 */
export function useFolderChangeLog(folderId: string | null | undefined) {
    return useInfiniteQuery({
        queryKey: folderChangeLogKey(folderId ?? ''),
        enabled: !!folderId,
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
            if (!folderId) {
                return { items: [], nextCursor: null } as FolderChangeLogPage;
            }
            const result = await getFolderChangeLogPage(folderId, {
                cursor: pageParam,
                take: 30,
            });
            if (!result.success) {
                throw new Error(result.error || 'Failed to load change log');
            }
            return result.data as FolderChangeLogPage;
        },
        getNextPageParam: (last) => last.nextCursor,
    });
}
