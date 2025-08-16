'use client';

import { useState, useCallback } from 'react';
import { createTemplate, getUserTemplates, deleteTemplate } from '@/actions/templates/pdfTemplateForm';
import { toast } from 'sonner';

export const usePdfTemplateForm = () => {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    const saveTemplate = useCallback(async (templateData: Template) => {
        setLoading(true);
        try {
            const result = await createTemplate(templateData);
            if (result.data) {
                toast.success('Template saved successfully!');
                // Refresh templates list
                await fetchTemplates();
                return { success: true, data: result.data };
            } else {
                toast.error(result.error || 'Failed to save template');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('An error occurred while saving template');
            return { success: false, error: 'An unexpected error occurred' };
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        setTemplatesLoading(true);
        try {
            const result = await getUserTemplates();
            if (result.data) {
                setTemplates(result.data);
                return { success: true, data: result.data };
            } else {
                console.error('Failed to fetch templates:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            return { success: false, error: 'An unexpected error occurred' };
        } finally {
            setTemplatesLoading(false);
        }
    }, []);

    const removeTemplate = useCallback(async (templateId: string) => {
        try {
            const result = await deleteTemplate(templateId);
            if (result.success) {
                toast.success('Template deleted successfully!');
                // Remove from local state
                setTemplates(prev => prev.filter(t => t.id !== templateId));
                return { success: true };
            } else {
                toast.error(result.error || 'Failed to delete template');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('An error occurred while deleting template');
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, []);

    return {
        loading,
        templates,
        templatesLoading,
        saveTemplate,
        fetchTemplates,
        removeTemplate,
    };
};
