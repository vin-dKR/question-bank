'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, AlertTriangle, CirclePlus } from 'lucide-react';
import { usePdfTemplateForm } from '@/hooks/templates/usePdfTemplateForm';
import { toast } from 'sonner';
import { useMediaQuery } from 'react-responsive';

const QuestionTemplate = () => {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({
        templateName: '',
        institution: '',
        institutionAddress: '',
        marks: '',
        time: '',
        exam: '',
        subject: '',
        logo: '',
        standard: '',
        session: ''
    });

    const { templates, templatesLoading, saveTemplate, fetchTemplates, removeTemplate, updateTemplate } = usePdfTemplateForm();
    const isMobile = useMediaQuery({ maxWidth: 768 });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const maxWidth = 400;
                    const maxHeight = 400;

                    let { width, height } = img;
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedLogo = canvas.toDataURL('image/jpeg', 0.7);
                        setFormData((prev) => ({ ...prev, logo: compressedLogo }));
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateTemplate = () => {
        setFormData({
            templateName: '',
            institution: '',
            institutionAddress: '',
            marks: '',
            time: '',
            exam: '',
            subject: '',
            logo: '',
            standard: '',
            session: ''
        });
        setEditingTemplate(null);
        setIsCreatingTemplate(true);
        setEditModalOpen(true);
    };

    const handleEditTemplate = (template: Template) => {
        setFormData(template);
        setEditingTemplate(template);
        setIsCreatingTemplate(false);
        setEditModalOpen(true);
    };

    const handleDeleteTemplate = (template: Template) => {
        setTemplateToDelete(template);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (templateToDelete) {
            await removeTemplate(templateToDelete.id);
            setDeleteModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    const handleSaveTemplate = async () => {
        if (!formData.templateName || !formData.institution || !formData.marks || !formData.time || !formData.exam || !formData.subject) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (isCreatingTemplate) {
                const templateData: Template = {
                    id: '',
                    templateName: formData.templateName,
                    institution: formData.institution,
                    institutionAddress: formData.institutionAddress,
                    marks: formData.marks,
                    time: formData.time,
                    exam: formData.exam,
                    subject: formData.subject,
                    logo: formData.logo,
                    standard: formData.standard,
                    session: formData.session,
                    saveTemplate: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await saveTemplate(templateData);
                if (result.success) {
                    setEditModalOpen(false);
                    setIsCreatingTemplate(false);
                }
            } else if (editingTemplate) {
                const updates: Partial<Template> = {};
                const keys: (keyof TemplateFormData)[] = [
                    'templateName', 'institution', 'institutionAddress', 'marks', 'time', 'exam', 'subject', 'logo', 'standard', 'session'
                ];

                keys.forEach((k) => {
                    const oldVal = (editingTemplate as Template)[k] ?? '';
                    const newVal = (formData as TemplateFormData)[k] ?? '';
                    if (oldVal !== newVal) {
                        // eslint-disable-next-line
                        (updates as any)[k] = newVal;
                    }
                });

                const result = await updateTemplate(editingTemplate.id, updates);
                if (result.success) {
                    setEditModalOpen(false);
                    setEditingTemplate(null);
                }
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 px-0 sm:px-2">
            <div className="w-full mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl md:text-3xl font-bold">PDF Templates</h1>
                    <Button onClick={handleCreateTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <CirclePlus className="w-4 h-4 mr-0 md:mr-2" />
                        {!isMobile && "Create Template"}
                    </Button>
                </div>

                {templatesLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading templates...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No templates found</p>
                        <p className="text-gray-400 text-sm mt-2">Create your first template to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <span className="text-lg">{template.templateName}</span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditTemplate(template)}
                                                className="p-1 h-8 w-8"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteTemplate(template)}
                                                className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium">Institution:</span> {template.institution}
                                        </div>
                                        <div>
                                            <span className="font-medium">Exam:</span> {template.exam}
                                        </div>
                                        <div>
                                            <span className="font-medium">Subject:</span> {template.subject}
                                        </div>
                                        <div>
                                            <span className="font-medium">Marks:</span> {template.marks}
                                        </div>
                                        <div>
                                            <span className="font-medium">Duration:</span> {template.time}
                                        </div>
                                        {template.standard && (
                                            <div>
                                                <span className="font-medium">Standard:</span> {template.standard}
                                            </div>
                                        )}
                                        {template.session && (
                                            <div>
                                                <span className="font-medium">Session:</span> {template.session}
                                            </div>
                                        )}
                                    </div>
                                    {template.logo && (
                                        <div className="mt-4">
                                            <img
                                                src={template.logo}
                                                alt="Template logo"
                                                className="w-16 h-16 object-contain rounded"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Template Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            {isCreatingTemplate ? 'Create New Template' : 'Edit Template'}
                        </DialogTitle>
                        <DialogDescription className='text-gray-500'>
                            Fill in the template details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="templateName">Template Name *</Label>
                            <Input
                                id="templateName"
                                name="templateName"
                                value={formData.templateName}
                                onChange={handleInputChange}
                                placeholder="Enter template name"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="institution">Institution Name *</Label>
                            <Input
                                id="institution"
                                name="institution"
                                value={formData.institution}
                                onChange={handleInputChange}
                                placeholder="Enter institution name"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="institutionAddress">Institution Address</Label>
                            <Input
                                id="institutionAddress"
                                name="institutionAddress"
                                value={formData.institutionAddress}
                                onChange={handleInputChange}
                                placeholder="Enter institution address"
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="session">Session</Label>
                            <Input
                                id="session"
                                name="session"
                                value={formData.session}
                                onChange={handleInputChange}
                                placeholder="Enter session"
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="standard">Standard</Label>
                            <Input
                                id="standard"
                                name="standard"
                                value={formData.standard}
                                onChange={handleInputChange}
                                placeholder="Enter class/standard"
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="marks">Total Marks *</Label>
                            <Input
                                id="marks"
                                name="marks"
                                type="number"
                                value={formData.marks}
                                onChange={handleInputChange}
                                placeholder="Enter total marks"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="time">Time Duration *</Label>
                            <Input
                                id="time"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                placeholder="e.g., 2 hours"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="exam">Exam Name *</Label>
                            <Input
                                id="exam"
                                name="exam"
                                value={formData.exam}
                                onChange={handleInputChange}
                                placeholder="Enter exam name"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject *</Label>
                            <Input
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="Enter subject"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="logo">Logo (Optional)</Label>
                            <Input
                                id="logo"
                                name="logo"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className='border border-black/30'
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button className='bg-black/20' onClick={() => setEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} className='bg-black text-white'>
                            {isCreatingTemplate ? 'Create Template' : 'Update Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Template
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{templateToDelete?.templateName}&quot;?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className='bg-black/20' onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QuestionTemplate;
