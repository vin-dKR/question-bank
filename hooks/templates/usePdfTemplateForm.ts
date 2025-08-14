"use client"

import { createTemplate, getUserTemplates } from "@/actions/templates/pdfTemplateForm"
import { useEffect, useState } from "react"

export const useTemplate = () => {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const { data, error: fetchErr } = await getUserTemplates()
                setTemplates(data ?? [])
                setError(fetchErr)
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError("An unexpected error occurred in cathch")
                }
            } finally {
                setLoading(false)
            }
        })()
    }, [])


    const addTemplate = async (formData: TemplateFormData) => {
        setLoading(true)
        try {
            const { data, error: createTemplateErr } = await createTemplate(formData)
            if (!data) {
                setError(createTemplateErr)
            } else {
                setTemplates((prev) => [data, ...prev])
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Failed to create template")
                throw err
            }
        } finally {
            setLoading(false)
        }
    }

    return {
        templates,
        loading,
        error,
        addTemplate,
        setTemplates
    }
}
