'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { CirclePlus, Trash2, AlertTriangle } from 'lucide-react';
import { usePdfTemplateForm } from '@/hooks/templates/usePdfTemplateForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TestCreatorAction } from '@/hooks/reducer/useTestCreatorReducer';

interface UnifiedTestDetailsFormProps {
    testData: CreateTestData;
    dispatch: (action: TestCreatorAction) => void;
    onTemplateSelect?: (template: Template) => void;
    selectedTemplate?: Template | null;
}

export default function UnifiedTestDetailsForm({ testData, dispatch, onTemplateSelect, selectedTemplate }: UnifiedTestDetailsFormProps) {
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({
        templateName: '',
        institution: '',
        institutionAddress: '',
        marks: testData.totalMarks.toString(),
        time: testData.duration.toString(),
        exam: testData.title,
        subject: testData.subject,
        logo: '',
        standard: '',
        session: ''
    });
    console.log("formdaa from unifiend", formData)

    const { templates, templatesLoading, saveTemplate, fetchTemplates, removeTemplate } = usePdfTemplateForm();

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Sync form data with test data changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            marks: testData.totalMarks.toString(),
            time: testData.duration.toString(),
            exam: testData.title,
            subject: testData.subject,
        }));
    }, [testData.totalMarks, testData.duration, testData.title, testData.subject]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // console.log('Form input changed:', name, value);
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Update test data based on form changes
        if (name === 'exam') {
            // console.log('Dispatching UPDATE_TEST_DATA for title:', value);
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'title', value });
        } else if (name === 'subject') {
            // console.log('Dispatching UPDATE_TEST_DATA for subject:', value);
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'subject', value });
        } else if (name === 'marks') {
            const marksValue = parseInt(value) || 0;
            // console.log('Dispatching UPDATE_TEST_DATA for totalMarks:', marksValue);
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'totalMarks', value: marksValue });
        } else if (name === 'time') {
            const durationValue = parseInt(value) || 60;
            // console.log('Dispatching UPDATE_TEST_DATA for duration:', durationValue);
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'duration', value: durationValue });
        } else if (name === 'institution') {
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'institution', value });
        } else if (name === 'institutionAddress') {
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'institutionAddress', value });
        } else if (name === 'standard') {
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'standard', value });
        } else if (name === 'session') {
            dispatch({ type: 'UPDATE_TEST_DATA', field: 'session', value });
        }



    }, [dispatch]);

    const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

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
                ctx.drawImage(img, 0, 0, width, height);
                const compressedLogo = canvas.toDataURL('image/jpeg', 0.7);
                setFormData((prev) => ({ ...prev, logo: compressedLogo }));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSelectTemplate = useCallback((template: Template) => {
        setFormData(template);
        setIsEditingTemplate(true);
        setShowTemplateModal(false);
        if (onTemplateSelect) {
            onTemplateSelect(template);
        }

        // Update test data with template values
        // console.log('Updating test data from template');
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'title', value: template.exam || '' });
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'subject', value: template.subject || '' });
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'totalMarks', value: parseInt(template.marks || '0') });
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'duration', value: parseInt(template.time || '60') });
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'institution', value: template.institution || '' })
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'institutionAddress', value: template.institutionAddress || '' })
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'standard', value: template.standard || '' })
        dispatch({ type: 'UPDATE_TEST_DATA', field: 'session', value: template.session || '' })
    }, [onTemplateSelect, dispatch]);

    const handleCreateTemplate = useCallback(() => {
        setFormData({
            templateName: '',
            institution: '',
            institutionAddress: '',
            marks: testData.totalMarks.toString(),
            time: testData.duration.toString(),
            exam: testData.title,
            subject: testData.subject,
            logo: '',
            standard: '',
            session: ''
        });
        setIsEditingTemplate(false);
        setShowTemplateModal(false);
    }, [testData]);

    const handleDeleteTemplate = async (e: React.MouseEvent, template: Template) => {
        e.stopPropagation();
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
            alert('Please fill in all required fields');
            return;
        }

        setIsCreatingTemplate(true);
        try {
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
                setShowTemplateModal(false);
            }
        } catch (error) {
            console.error('Error saving template:', error);
        } finally {
            setIsCreatingTemplate(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Test Details
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowTemplateModal(true)}
                                size="sm"
                                className='bg-black text-white'
                            >
                                <CirclePlus className="w-4 h-4 mr-2" />
                                Templates
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="title">Test Title *</Label>
                            <Input
                                id="title"
                                name="exam"
                                value={formData.exam || ''}
                                onChange={handleInputChange}
                                placeholder="Enter test title"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject *</Label>
                            <Input
                                id="subject"
                                name="subject"
                                value={formData.subject || ''}
                                onChange={handleInputChange}
                                placeholder="Enter subject"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="duration">Duration (minutes) *</Label>
                            <Input
                                id="duration"
                                name="time"
                                type="number"
                                value={formData.time || ''}
                                onChange={handleInputChange}
                                placeholder="Enter duration in minutes"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="totalMarks">Total Marks *</Label>
                            <Input
                                id="totalMarks"
                                name="marks"
                                type="number"
                                value={formData.marks || ''}
                                onChange={handleInputChange}
                                placeholder="Enter total marks"
                                required
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="institution">Institution Name *</Label>
                            <Input
                                id="institution"
                                name="institution"
                                value={formData.institution || ''}
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
                                value={formData.institutionAddress || ''}
                                onChange={handleInputChange}
                                placeholder="Enter institution address"
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="standard">Standard/Class</Label>
                            <Input
                                id="standard"
                                name="standard"
                                value={formData.standard || ''}
                                onChange={handleInputChange}
                                placeholder="Enter class/standard"
                                className='border border-black/30'
                            />
                        </div>
                        <div>
                            <Label htmlFor="session">Session</Label>
                            <Input
                                id="session"
                                name="session"
                                value={formData.session || ''}
                                onChange={handleInputChange}
                                placeholder="Enter session"
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

                    {selectedTemplate && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Selected Template:</strong> {selectedTemplate.templateName}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Template Selection Modal */}
            <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
                <DialogContent className="bg-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Select Template</DialogTitle>
                        <DialogDescription>
                            Choose a template to pre-fill the form or create a new one.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Create new template button */}
                        <Button
                            onClick={handleCreateTemplate}
                            className="flex flex-col items-center justify-center bg-indigo-600 min-h-[8rem] w-full hover:bg-indigo-700 text-white border border-black/30 p-2"
                        >
                            <CirclePlus style={{ width: '2rem', height: '2rem' }} />
                            <span className="text-sm text-center break-words">
                                Create New Template
                            </span>
                        </Button>

                        {/* Loading state */}
                        {templatesLoading && (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                                    <span>Loading templates...</span>
                                </div>
                            </div>
                        )}

                        {/* No templates state */}
                        {!templatesLoading && templates.length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                <p>No saved templates found.</p>
                                <p className="text-sm">Create your first template to get started.</p>
                            </div>
                        )}

                        {/* Templates list */}
                        {!templatesLoading && templates.length > 0 && (
                            templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="relative flex flex-col items-center justify-center bg-gray-200 min-h-[8rem] w-full hover:bg-gray-300 text-black border border-black/10 p-2 text-center break-words rounded-lg cursor-pointer"
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    {/* Delete button in top corner */}
                                    <button
                                        onClick={(e) => handleDeleteTemplate(e, template)}
                                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                                        title="Delete template"
                                    >
                                        <Trash2 size={12} />
                                    </button>

                                    <div className="mt-2">
                                        {template.templateName} ({template.exam} - {template.subject})
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter>
                        <Button className='bg-gray-300' onClick={() => setShowTemplateModal(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Template Creation/Edit Modal */}
            <Dialog open={isEditingTemplate || isCreatingTemplate} onOpenChange={() => { }}>
                <DialogContent className="bg-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditingTemplate ? 'Edit Template' : 'Create New Template'}
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the template details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="templateName">Template Name *</Label>
                            <Input
                                id="templateName"
                                name="templateName"
                                value={formData.templateName}
                                onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, institutionAddress: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, standard: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, marks: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, exam: e.target.value }))}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
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
                        <Button className='bg-gray-300' onClick={() => { setIsEditingTemplate(false); setIsCreatingTemplate(false); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={isCreatingTemplate} className='bg-black text-white'>
                            {isCreatingTemplate ? 'Saving...' : 'Save Template'}
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
                        <Button className='bg-gray-300' onClick={() => setDeleteModalOpen(false)}>
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
}
