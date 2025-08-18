'use client';

import { useState, useCallback, useRef } from 'react';
import { createTemplate, getUserTemplates, deleteTemplate } from '@/actions/templates/pdfTemplateForm';
import { toast } from 'sonner';

export const usePdfTemplateForm = () => {
    const [loading, setLoading] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const fetchingRef = useRef(false);
    const hasInitializedRef = useRef(false);

    const saveTemplate = useCallback(async (templateData: Template) => {
        setLoading(true);
        try {
            const result = await createTemplate(templateData);
            if (result.data) {
                toast.success('Template saved successfully!');
                // Force refresh templates list immediately
                await fetchTemplates(true);
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

    const fetchTemplates = useCallback(async (forceRefresh = false) => {
        // If already fetching and not forcing refresh, return cached data
        if (fetchingRef.current && !forceRefresh) {
            console.log('Already fetching templates, returning cached data');
            return { success: true, data: templates };
        }

        // For first load or force refresh, fetch immediately
        if (!hasInitializedRef.current || forceRefresh) {
            console.log('Fetching templates immediately (first load or force refresh)');
            fetchingRef.current = true;
            setTemplatesLoading(true);

            try {
                const result = await getUserTemplates();
                if (result.data) {
                    setTemplates(result.data);
                    setLastFetchTime(Date.now());
                    hasInitializedRef.current = true;
                    return { success: true, data: result.data };
                } else {
                    console.error('Failed to fetch templates:', result.error);
                    return { success: false, error: result.error };
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
                return { success: false, error: 'An unexpected error occurred' };
            } finally {
                fetchingRef.current = false;
                setTemplatesLoading(false);
            }
        }

        // For subsequent calls, use shorter cache (5 seconds)
        const now = Date.now();
        const cacheTime = 5 * 1000; // 5 seconds instead of 30

        if (!forceRefresh && now - lastFetchTime < cacheTime && templates.length > 0) {
            console.log('Using cached templates (cache valid)');
            return { success: true, data: templates };
        }

        // Cache expired, fetch fresh data
        console.log('Cache expired, fetching fresh templates');
        fetchingRef.current = true;
        setTemplatesLoading(true);

        try {
            const result = await getUserTemplates();
            if (result.data) {
                setTemplates(result.data);
                setLastFetchTime(now);
                return { success: true, data: result.data };
            } else {
                console.error('Failed to fetch templates:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            return { success: false, error: 'An unexpected error occurred' };
        } finally {
            fetchingRef.current = false;
            setTemplatesLoading(false);
        }
    }, []); // Remove dependencies to prevent re-creation

    const removeTemplate = useCallback(async (templateId: string) => {
        try {
            const result = await deleteTemplate(templateId);
            if (result.success) {
                toast.success('Template deleted successfully!');
                // Remove from local state immediately
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
        templatesLoading,
        templates,
        saveTemplate,
        fetchTemplates,
        removeTemplate,
    };
};
