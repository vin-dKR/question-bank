'use client';

import { Input } from '@/components/ui/input';
import { useState, useRef } from 'react';
import { X } from 'lucide-react';

export default function LogoUploader({ onUpload }: LogoUploaderProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
        onUpload(file);
    };

    const handleRemoveImage = () => {
        setPreview(null);
        onUpload(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <label
                    htmlFor="picture"
                    className="block text-sm font-medium text-slate-600 mb-1 sm:mb-2"
                >
                    Institution Logo
                    <span className='text-red-600 text-[11px]'> *only .png format</span>
                </label>
                <div className="relative">
                    <Input
                        id="picture"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        ref={fileInputRef}
                        className="w-full h-full sm:p-3 border border-slate-200 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                </div>
            </div>
            {preview && (
                <div className="relative max-w-full sm:max-w-xs mx-auto">
                    <img
                        src={preview}
                        alt="Logo preview"
                        className="w-full h-auto object-contain rounded-md border border-slate-200 shadow-sm"
                    />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-slate-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-90 transition"
                        aria-label="Remove image"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
