'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FormField({
    id,
    label,
    type,
    name,
    value,
    onChange,
    placeholder,
    accept,
    required,
}: FormFieldProps) {
    return (
        <div className='tracking-3'>
            <Label htmlFor={id} className='tracking-3 text-md mb-1'>{label}</Label>
            <Input
                id={id}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                accept={accept}
                required={required}
                className='border border-black/10'
                style={{ borderRadius: "10px" }}
            />
        </div>
    );
}
