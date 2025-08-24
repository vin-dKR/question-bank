import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';


class CollaborationServer {
    private wss: WebSocketServer;
    private rooms: Map<string, Set<ConnectedUser>> = new Map();

    constructor(port: number = 3001) {
        this.wss = new WebSocketServer({ port });
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
            const url = new URL(request.url!, `http://${request.headers.host}`);
            const folderId = url.searchParams.get('folderId');
            const userId = url.searchParams.get('userId');
            const userName = url.searchParams.get('userName');

            if (!folderId || !userId || !userName) {
                ws.close(1008, 'Missing required parameters');
                return;
            }

            const user: ConnectedUser = { ws, userId, userName, folderId };
            this.joinRoom(folderId, user);

            ws.on('message', (data: Buffer) => {
                try {
                    const message: CollaborationMessage = JSON.parse(data.toString());
                    this.handleMessage(message, user);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            ws.on('close', () => {
                this.leaveRoom(folderId, user);
            });

            ws.on('error', (error: Error) => {
                console.error('WebSocket error:', error);
                this.leaveRoom(folderId, user);
            });
        });
    }

    private joinRoom(folderId: string, user: ConnectedUser) {
        if (!this.rooms.has(folderId)) {
            this.rooms.set(folderId, new Set());
        }
        this.rooms.get(folderId)!.add(user);

        // Notify others in the room
        this.broadcastToRoom(folderId, {
            type: 'presence',
            folderId,
            userId: user.userId,
            userName: user.userName,
            data: { action: 'joined' }
        }, user.userId);

        // Send current room state to new user
        const roomUsers = Array.from(this.rooms.get(folderId)!).map(u => ({
            userId: u.userId,
            userName: u.userName
        }));
        user.ws.send(JSON.stringify({
            type: 'presence',
            folderId,
            userId: user.userId,
            userName: user.userName,
            data: { action: 'room_state', users: roomUsers }
        }));
    }

    private leaveRoom(folderId: string, user: ConnectedUser) {
        const room = this.rooms.get(folderId);
        if (room) {
            room.delete(user);
            if (room.size === 0) {
                this.rooms.delete(folderId);
            } else {
                // Notify others that user left
                this.broadcastToRoom(folderId, {
                    type: 'presence',
                    folderId,
                    userId: user.userId,
                    userName: user.userName,
                    data: { action: 'left' }
                }, user.userId);
            }
        }
    }

    private handleMessage(message: CollaborationMessage, user: ConnectedUser) {
        switch (message.type) {
            case 'update':
                // Broadcast folder updates to all users in the room
                this.broadcastToRoom(message.folderId, message, user.userId);
                break;
            case 'cursor':
                // Broadcast cursor position to others
                this.broadcastToRoom(message.folderId, message, user.userId);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    private broadcastToRoom(folderId: string, message: CollaborationMessage, excludeUserId?: string) {
        const room = this.rooms.get(folderId);
        if (room) {
            room.forEach(user => {
                if (user.userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
                    user.ws.send(JSON.stringify(message));
                }
            });
        }
    }

    public broadcastFolderUpdate(folderId: string, update: CollaborationMessageData) {
        this.broadcastToRoom(folderId, {
            type: 'update',
            folderId,
            userId: 'system',
            userName: 'System',
            data: update
        });
    }

    public getRoomUsers(folderId: string): string[] {
        const room = this.rooms.get(folderId);
        return room ? Array.from(room).map(u => u.userName) : [];
    }
}

// Export singleton instance
let collaborationServer: CollaborationServer | null = null;

export function getCollaborationServer(): CollaborationServer {
    if (!collaborationServer) {
        collaborationServer = new CollaborationServer();
    }
    return collaborationServer;
}

export function createCollaborationClient(folderId: string, userId: string, userName: string): WebSocket {
    return new WebSocket(`ws://ws-questions-b-production.up.railway.app?folderId=${folderId}&userId=${userId}&userName=${userName}`);
} 
