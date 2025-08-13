'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FormField from './FormField';
import { Label } from '../ui/label';
import { CirclePlus } from 'lucide-react';

interface FormData {
    templateName: string;
    institution: string;
    marks: string;
    time: string;
    exam: string;
    subject: string;
    logo: string;
}

interface Template extends FormData {
    id: string;
}

interface PDFDetailsFormProps {
    initialData: FormData;
    onSubmit: (data: FormData) => void;
    onCancel: () => void;
}

export default function PDFDetailsForm({ initialData, onSubmit, onCancel }: PDFDetailsFormProps) {
    const [formStep, setFormStep] = useState<'templates' | 'form'>('templates');
    const [formData, setFormData] = useState<FormData>({
        templateName: '',
        institution: initialData.institution,
        marks: initialData.marks,
        time: initialData.time,
        exam: initialData.exam,
        subject: initialData.subject,
        logo: initialData.logo,
    });
    const [saveTemplate, setSaveTemplate] = useState(true);
    const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);

    useEffect(() => {
        // Load saved templates from local storage
        const templates = localStorage.getItem('pdfTemplates');
        if (templates) {
            setSavedTemplates(JSON.parse(templates));
        }
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
                setFormData((prev) => ({ ...prev, logo: reader.result as string }));
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

    const handleSubmit = () => {
        if (validateForm()) {
            if (saveTemplate) {
                const newTemplate: Template = {
                    id: crypto.randomUUID(),
                    ...formData,
                };
                const updatedTemplates = [...savedTemplates, newTemplate];
                setSavedTemplates(updatedTemplates);
                localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
            }
            onSubmit(formData);
        }
    };

    const handleSelectTemplate = (template: Template) => {
        setFormData(template);
        setFormStep('form');
    };

    const handleCreateTemplate = () => {
        setFormData({
            templateName: '',
            institution: initialData.institution,
            marks: '',
            time: '',
            exam: '',
            subject: '',
            logo: '',
        });
        setSaveTemplate(true);
        setFormStep('form');
    };

    return (
        <div className="mt-4">
            {formStep === 'templates' ? (
                <div>
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

                        {/* Saved templates or "no templates" message */}
                        {savedTemplates.length > 0 ? (
                            savedTemplates.map((template) => (
                                <Button
                                    key={template.id}
                                    className="flex flex-col items-center justify-center bg-gray-200 min-h-[8rem] w-full hover:bg-gray-300 text-black border border-black/10 p-2 text-center break-words"
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    {template.templateName} ({template.exam} - {template.subject})
                                </Button>
                            ))
                        ) : (
                            <p className="col-span-full flex items-center justify-center text-gray-500">
                                No saved templates. Create a new one!
                            </p>
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
                        <input
                            type="checkbox"
                            id="saveTemplate"
                            checked={saveTemplate}
                            onChange={(e) => setSaveTemplate(e.target.checked)}
                        />
                        <Label htmlFor="saveTemplate">Save as template</Label>
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white border-black/70"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
