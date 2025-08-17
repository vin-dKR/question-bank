'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FormField from './FormField';
import { Label } from '../ui/label';
import { CirclePlus, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePdfTemplateForm } from '@/hooks/templates/usePdfTemplateForm';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';


export default function PDFDetailsForm({ initialData, onSubmit, onCancel, isGenerating }: PDFDetailsFormProps) {
    const [formStep, setFormStep] = useState<'templates' | 'form'>('templates');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({
        templateName: '',
        institution: initialData.institution,
        marks: initialData.marks,
        time: initialData.time,
        exam: initialData.exam,
        subject: initialData.subject,
        logo: initialData.logo,
    });
    const [saveTemplate, setSaveTemplate] = useState(true);

    const { templates, templatesLoading, saveTemplate: saveTemplateAction, fetchTemplates, removeTemplate } = usePdfTemplateForm()

    // Fetch templates on component mount - only run once
    useEffect(() => {
        const loadTemplates = async () => {
            console.log('Loading templates...');
            // Force fetch on first load to ensure we get fresh data
            await fetchTemplates(true);
        };
        loadTemplates();
    }, []); // Remove fetchTemplates from dependencies to prevent multiple calls

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                // Compress the image to reduce size
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set maximum dimensions
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
                        // Convert to base64 with reduced quality
                        const compressedLogo = canvas.toDataURL('image/jpeg', 0.7);
                        setFormData((prev) => ({ ...prev, logo: compressedLogo }));
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        if (
            !formData.templateName ||
            !formData.institution ||
            !formData.marks ||
            !formData.time ||
            !formData.exam ||
            !formData.subject
        ) {
            alert('Please fill in all required fields');
            return false;
        }
        return true;
    };

    const handleSelectTemplate = (template: Template) => {
        setFormData(template);
        setIsEditingTemplate(true);
        setSaveTemplate(false); 
        setFormStep('form');
    };

    const handleCreateTemplate = () => {
        setFormData({
            templateName: '',
            institution: '',
            marks: '',
            time: '',
            exam: '',
            subject: '',
            logo: '',
        });
        setIsEditingTemplate(false);
        setSaveTemplate(true);
        setFormStep('form');
    };

    const handleDeleteTemplate = async (e: React.MouseEvent, template: Template) => {
        e.stopPropagation(); // Prevent template selection when clicking delete
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

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setTemplateToDelete(null);
    };

    const handleRefreshTemplates = async () => {
        console.log('Manually refreshing templates...');
        await fetchTemplates(true);
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsCreatingTemplate(true);
            try {
                console.log('Form submission - isEditingTemplate:', isEditingTemplate, 'saveTemplate:', saveTemplate);
                
                // Only save as template if it's a new template and user wants to save
                if (saveTemplate && !isEditingTemplate) {
                    console.log('Creating new template...');
                    const templateData: Template = {
                        id: '', // Will be generated by the server
                        templateName: formData.templateName,
                        institution: formData.institution,
                        marks: formData.marks,
                        time: formData.time,
                        exam: formData.exam,
                        subject: formData.subject,
                        logo: formData.logo,
                        saveTemplate: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    console.log('Template data being sent:', templateData);
                    const result = await saveTemplateAction(templateData);
                    console.log('Template creation result:', result);
                    
                    if (!result.success) {
                        console.error('Template creation failed:', result.error);
                        alert(`Failed to save template: ${result.error}`);
                        setIsCreatingTemplate(false);
                        return;
                    }
                } else {
                    console.log('Skipping template creation - editing existing template or user chose not to save');
                }
                
                console.log('Submitting form data:', formData);
                onSubmit(formData);
            } catch (error) {
                console.error('Error in form submission:', error);
                alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setIsCreatingTemplate(false);
            }
        }
    };

    return (
        <div className="mt-4">
            {formStep === 'templates' ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Select Template</h3>
                    </div>
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

                    <div className="flex justify-end mt-4">
                        <Button className='bg-gray-200 border border-black/10' onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField
                            id="templateName"
                            label="Template Name *"
                            type="text"
                            name="templateName"
                            value={formData.templateName}
                            onChange={handleInputChange}
                            placeholder="Enter template name"
                            required
                        />
                        <FormField
                            id="institution"
                            label="Institution Name *"
                            type="text"
                            name="institution"
                            value={formData.institution}
                            onChange={handleInputChange}
                            placeholder="Enter institution name"
                            required
                        />
                        <FormField
                            id="marks"
                            label="Total Marks *"
                            type="number"
                            name="marks"
                            value={formData.marks}
                            onChange={handleInputChange}
                            placeholder="Enter total marks"
                            required
                        />
                        <FormField
                            id="time"
                            label="Time Duration *"
                            type="text"
                            name="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            placeholder="e.g., 2 hours"
                            required
                        />
                        <FormField
                            id="exam"
                            label="Exam Name *"
                            type="text"
                            name="exam"
                            value={formData.exam}
                            onChange={handleInputChange}
                            placeholder="Enter exam name"
                            required
                        />
                        <FormField
                            id="subject"
                            label="Subject *"
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="Enter subject"
                            required
                        />
                        <FormField
                            id="logo"
                            label="Logo (Optional)"
                            type="file"
                            name="logo"
                            accept="image/*"
                            onChange={handleLogoChange}
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        {!isEditingTemplate && (
                            <>
                                <input
                                    type="checkbox"
                                    id="saveTemplate"
                                    checked={saveTemplate}
                                    onChange={(e) => setSaveTemplate(e.target.checked)}
                                />
                                <Label htmlFor="saveTemplate">Save as template</Label>
                            </>
                        )}
                        {isEditingTemplate && (
                            <span className="text-sm text-gray-600 italic">
                                Editing existing template: {formData.templateName}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between mt-4">
                        <Button
                            onClick={() => setFormStep('templates')}
                            className='bg-gray-200 border border-black/10'
                        >
                            Back
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                onClick={onCancel}
                                className='bg-gray-200 border border-black/10'
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isGenerating || isCreatingTemplate}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white border-black/70 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            >
                                {isCreatingTemplate ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving Template...
                                    </>
                                ) : isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    'Next'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-xl border border-black/20">
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
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={cancelDelete}
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
