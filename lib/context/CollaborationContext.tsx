'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { folderCollaboratorsKey } from '@/hooks/queries/useFolderCollaborators';
import { folderChangeLogKey } from '@/hooks/queries/useFolderChangeLog';

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);
    const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const connectionAttemptsRef = useRef<number>(0);
    const maxConnectionAttempts = 3;
    const wsCandidatesRef = useRef<string[]>([]);
    const wsCandidateIndexRef = useRef<number>(0);
    const isLeavingRef = useRef<boolean>(false); // Track intentional leave

    const buildCandidates = useCallback((folderId: string) => {
        const base = 'wss://ws-questions-b.onrender.com';
        const query = `folderId=${encodeURIComponent(folderId)}&userId=${encodeURIComponent(user?.id || '')}&userName=${encodeURIComponent(user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'Unknown')}`;
        return [
            `${base}?${query}`,
            `${base}/?${query}`,
            `${base}/ws?${query}`,
        ];
    }, [user?.id, user?.fullName, user?.emailAddresses]);

    const connectToFolder = useCallback((folderId: string) => {
        if (!user) return;

        // Don't reconnect if already connected to this folder
        if (wsRef.current && currentFolderId === folderId && isConnected && !isLeavingRef.current) {
            console.log('Already connected to folder:', folderId);
            return;
        }

        // Check if we've exceeded max connection attempts
        if (connectionAttemptsRef.current >= maxConnectionAttempts) {
            console.warn('Max connection attempts reached, skipping WebSocket connection');
            return;
        }

        // Close existing connection if not already leaving
        if (wsRef.current && !isLeavingRef.current) {
            wsRef.current.close(1000, 'Intentional disconnect'); // Use normal closure code
        }

        connectionAttemptsRef.current++;
        // Initialize/refresh candidate list when folder changes or list empty
        const needsInit = wsCandidatesRef.current.length === 0 || !wsCandidatesRef.current[0]?.includes(folderId);
        if (needsInit) {
            wsCandidatesRef.current = buildCandidates(folderId);
            wsCandidateIndexRef.current = 0;
        }

        try {
            const wsUrl = wsCandidatesRef.current[wsCandidateIndexRef.current] || wsCandidatesRef.current[0];
            const newWs = new WebSocket(wsUrl);

            // Set a timeout for connection
            const connectionTimeout = setTimeout(() => {
                if (newWs.readyState === WebSocket.CONNECTING) {
                    console.warn('WebSocket connection timeout');
                    newWs.close(1000, 'Connection timeout');
                }
            }, 5000);

            newWs.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('WebSocket connected to folder:', folderId);
                setIsConnected(true);
                setCurrentFolderId(folderId);
                connectionAttemptsRef.current = 0; // Reset on successful connection
                isLeavingRef.current = false; // Reset leaving state
            };

            newWs.onmessage = (event) => {
                try {
                    const message: CollaborationMessage = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            newWs.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('WebSocket closed:', event.code, event.reason, 'candidate:', wsCandidateIndexRef.current);
                setIsConnected(false);
                setConnectedUsers([]);
                setCurrentFolderId(null);

                // Skip reconnection if intentionally closed
                if (event.code === 1000 || isLeavingRef.current) {
                    console.log('Intentional WebSocket closure, skipping reconnection');
                    isLeavingRef.current = false; // Reset leaving state
                    return;
                }

                // Try next candidate on abnormal close
                if ((event.code === 1006 || event.code === 1005) && wsCandidateIndexRef.current < wsCandidatesRef.current.length - 1) {
                    wsCandidateIndexRef.current += 1;
                    connectToFolder(folderId);
                    return;
                }

                // Backoff retry from first candidate
                if (connectionAttemptsRef.current < maxConnectionAttempts) {
                    const delay = Math.min(10000, 500 * Math.pow(2, connectionAttemptsRef.current));
                    setTimeout(() => {
                        wsCandidateIndexRef.current = 0;
                        connectToFolder(folderId);
                    }, delay);
                }
            };

            newWs.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('WebSocket connection error:', error);
                setIsConnected(false);
            };

            wsRef.current = newWs;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setIsConnected(false);
        }
    }, [user, currentFolderId, isConnected]);

    const handleMessage = useCallback((message: CollaborationMessage) => {
        // Invalidate TanStack Query caches rather than imperatively refetching.
        // The WS is the signal; TanStack owns the fetch lifecycle (dedupe,
        // SWR, retry). See Phase 10 in `eduents/REFACTOR_PLAN.md`.
        //
        // Mapping of WS message shapes → query keys (best-effort, given the
        // WS protocol is a pure broadcast hub — collaborator membership
        // changes are driven by server actions, not dedicated WS events):
        //
        //   presence/room_state | joined | left  → collaborators (online
        //                                           status + roster refresh)
        //   presence/reorder                      → changeLog (audit row was
        //                                           just written server-side)
        //   update                                → changeLog (any folder
        //                                           mutation broadcasts this)
        //   cursor                                → neither (ephemeral)
        //
        // TODO Phase 10 follow-up: if the WS protocol grows explicit
        // `collaborator_added` / `collaborator_removed` / `role_changed`
        // event types, switch `presence` handling to invalidate
        // `collaborators` only on those, and drop the roster-refresh on
        // raw join/leave.
        const folderIdForInvalidation = message.folderId || currentFolderId;
        const invalidateCollaborators = () => {
            if (!folderIdForInvalidation) return;
            queryClient.invalidateQueries({
                queryKey: folderCollaboratorsKey(folderIdForInvalidation),
            });
        };
        const invalidateChangeLog = () => {
            if (!folderIdForInvalidation) return;
            queryClient.invalidateQueries({
                queryKey: folderChangeLogKey(folderIdForInvalidation),
            });
        };

        switch (message.type) {
            case 'presence': {
                const action = message.data?.action;
                const users = message.data?.users;
                if (action === 'room_state' && Array.isArray(users)) {
                    const mapped = users.map((u: CollaborationUser) => ({
                        userId: u.userId,
                        userName: u.userName,
                        isOnline: true,
                    }));
                    const unique = new Map<string, CollaborationUser>();
                    mapped.forEach((u) => unique.set(u.userId, u));
                    setConnectedUsers(Array.from(unique.values()));
                    invalidateCollaborators();
                } else if (action === 'joined') {
                    setConnectedUsers(prev => {
                        const existing = prev.find(u => u.userId === message.userId);
                        if (existing) return prev;
                        const next = [...prev, {
                            userId: message.userId,
                            userName: message.userName,
                            isOnline: true,
                        }];
                        const unique = new Map<string, CollaborationUser>();
                        next.forEach((u) => unique.set(u.userId, u));
                        return Array.from(unique.values());
                    });
                    invalidateCollaborators();
                } else if (action === 'left') {
                    console.log("user left -----------------------------------------------------")
                    setConnectedUsers(prev => prev.filter(u => u.userId !== message.userId));
                    invalidateCollaborators();
                } else if (action === 'reorder') {
                    // Reorder writes a FolderChangeLog row via the server
                    // action; refetch the log so any open audit view updates.
                    invalidateChangeLog();
                }
                break;
            }
            case 'update':
                console.log('Folder updated by:', message.userName);
                // A generic folder-level broadcast. Almost all write paths
                // append to FolderChangeLog, so treat `update` as a log
                // invalidation signal.
                invalidateChangeLog();
                break;
            case 'cursor':
                // Ephemeral — no server-state side effect. Deliberately not
                // invalidating anything.
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }, [queryClient, currentFolderId]);

    const sendMessage = useCallback((message: CollaborationMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const joinFolder = useCallback((folderId: string) => {
        isLeavingRef.current = false; // Ensure not marked as leaving
        connectToFolder(folderId);
    }, [connectToFolder]);

    const leaveFolder = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            isLeavingRef.current = true; // Mark as intentional leave
            wsRef.current.close(1000, 'Intentional disconnect');
            wsRef.current = null;
            setIsConnected(false);
            setConnectedUsers([]);
            setCurrentFolderId(null);
            connectionAttemptsRef.current = 0; // Reset connection attempts
            wsCandidateIndexRef.current = 0; // Reset candidate index
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveFolder();
        };
    }, [leaveFolder]);

    // Reset connection attempts when user changes
    useEffect(() => {
        connectionAttemptsRef.current = 0;
    }, [user]);

    const value = useMemo(() => ({
        connectedUsers,
        isConnected,
        sendMessage,
        joinFolder,
        leaveFolder,
        currentFolderId,
    }), [connectedUsers, isConnected, sendMessage, joinFolder, leaveFolder, currentFolderId]);

    return (
        <CollaborationContext.Provider value={value}>
            {children}
        </CollaborationContext.Provider>
    );
}

export function useCollaboration() {
    const context = useContext(CollaborationContext);
    if (!context) {
        throw new Error('useCollaboration must be used within a CollaborationProvider');
    }
    return context;
}
