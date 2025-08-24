'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollaboration } from '@/lib/context/CollaborationContext';
import { inviteCollaborator, getFolderCollaborators, removeCollaborator, generateInviteLink } from '@/actions/collaboration/folder';
import { Users, UserPlus, UserMinus, Crown, Edit, Eye, Link, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CollaborationPanelProps {
    folderId: string;
    folderName: string;
    userRole: 'owner' | 'editor' | 'viewer';
}

interface Collaborator {
    id: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

export function CollaborationPanel({ folderId, folderName, userRole }: CollaborationPanelProps) {
    const { connectedUsers, isConnected } = useCollaboration();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string>('');
    const [showInviteLink, setShowInviteLink] = useState(false);

    const loadCollaborators = async () => {
        try {
            const result = await getFolderCollaborators(folderId);
            if (result.success) {
                setCollaborators(result.data || []);
            }
        } catch {
            console.error('Failed to load collaborators');
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        setIsLoading(true);
        try {
            const result = await inviteCollaborator({
                folderId,
                email: inviteEmail.trim(),
                role: inviteRole,
            });

            if (result.success) {
                const emailSent = result.data?.emailSent;
                const link = result.data?.inviteLink;

                if (emailSent) {
                    toast.success(`Invitation sent to ${inviteEmail}`);
                } else {
                    toast.warning(`Invitation created but email failed to send. You can share this link manually: ${link}`);
                }

                setInviteEmail('');
                await loadCollaborators();
            } else {
                toast.error(result.error || 'Failed to send invitation');
            }
        } catch {
            toast.error('Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        try {
            const result = await generateInviteLink(folderId);
            if (result.success) {
                setInviteLink(result.data.inviteLink);
                setShowInviteLink(true);
            } else {
                toast.error(result.error || 'Failed to generate invite link');
            }
        } catch {
            toast.error('Failed to generate invite link');
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            toast.success('Invite link copied to clipboard!');
        } catch {
            toast.error('Failed to copy link');
        }
    };

    // Load collaborators on mount
    useEffect(() => {
        loadCollaborators();
    }, [folderId]);

    const handleRemoveCollaborator = async (collaboratorId: string) => {
        try {
            const result = await removeCollaborator(folderId, collaboratorId);
            if (result.success) {
                toast.success('Collaborator removed');
                await loadCollaborators();
            } else {
                toast.error(result.error || 'Failed to remove collaborator');
            }
        } catch {
            toast.error('Failed to remove collaborator');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Crown className="h-4 w-4 text-yellow-500" />;
            case 'editor':
                return <Edit className="h-4 w-4 text-blue-500" />;
            case 'viewer':
                return <Eye className="h-4 w-4 text-gray-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collaboration
                </h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600">
                        {isConnected ? `${connectedUsers.length} online` : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Connected Users */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Online</h4>
                <div className="space-y-1">
                    {connectedUsers.length > 0 ? (
                        connectedUsers.map((user) => (
                            <div key={user.userId} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>{user.userName}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No one online</p>
                    )}
                </div>
            </div>

            {/* Invite Collaborator */}
            {(userRole === 'owner' || userRole === 'editor') && (
                <div className="space-y-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-full">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite by Email
                            </Button>
                        </DialogTrigger>
                        <DialogContent className='bg-white rounded-xl'>
                            <DialogHeader>
                                <DialogTitle>Invite to &quot;{folderName}&quot;</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        className='border border-black/30'
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                                        <SelectTrigger className='border border-black/20'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className='border border-black/20 bg-white'>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleInvite} disabled={isLoading} className="w-full bg-black rounded-xl text-white">
                                    {isLoading ? 'Sending...' : 'Send Invitation'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleGenerateLink}
                    >
                        <Link className="h-4 w-4 mr-2" />
                        Copy Invite Link
                    </Button>
                </div>
            )}

            {/* Invite Link Dialog */}
            <Dialog open={showInviteLink} onOpenChange={setShowInviteLink}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Link for &quot;{folderName}&quot;</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="inviteLink">Share this link with collaborators:</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    id="inviteLink"
                                    value={inviteLink}
                                    readOnly
                                    className="flex-1"
                                />
                                <Button size="sm" onClick={handleCopyLink}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Anyone with this link can join the collaboration. The link will work for users who are already signed up.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Collaborators List */}
            <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">All Collaborators</h4>
                <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                                {getRoleIcon(collaborator.role)}
                                <span className="text-sm">{collaborator.user.name || collaborator.user.email}</span>
                                <span className="text-xs text-gray-500">({collaborator.role})</span>
                            </div>
                            {userRole === 'owner' && collaborator.role !== 'owner' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveCollaborator(collaborator.user.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <UserMinus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 
