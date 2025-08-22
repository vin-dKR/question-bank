"use client"
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";


export function FormInput({
    id,
    name,
    value,
    onChange,
    placeholder,
    label,
    type = "text",
    isRequired = false,
}: FormInputProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="border border-black/10 w-80"
            />
        </div>
    );
}


export function FormSelect({
    id,
    name,
    value,
    onChange,
    placeholder,
    label,
    options,
    isRequired = false,
}: FormSelectProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="border border-black/10">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="bg-white text-black border border-black/10">
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <input type="hidden" name={name} value={value ?? ""} />
        </div>
    );
}


export function FormCheckboxGroup({
    name,
    label,
    options,
    values,
    onChange,
    isRequired = false,
}: FormCheckboxGroupProps) {
    return (
        <div className="space-y-3">
            <Label>
                {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
                {options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={option.id}
                            checked={values.includes(option.id)}
                            onCheckedChange={(checked) => onChange(option.id, checked as boolean)}
                        />
                        <Label htmlFor={option.id} className="text-sm font-normal">
                            {option.label}
                        </Label>
                    </div>
                ))}
            </div>
            <input type="hidden" name={name} value={JSON.stringify(values) ?? "[]"} />
        </div>
    );
}


export function SubmitButton({ loading }: SubmitButtonProps) {
    return (
        <Button
            type="submit"
            size="lg"
            className="bg-black text-white rounded-xl disabled:opacity-50"
            disabled={loading}
        >
            Complete Setup
            {loading ? (
                <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
            ) : (
                <ArrowRight className="ml-2 h-4 w-4" />
            )}
        </Button>
    );
}


export function OnboardingLayout({ title, description, children }: OnboardingLayoutProps) {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-4xl px-6">
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 bg-black/4 border border-black/5"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="mt-2 text-gray-600">{description}</p>
                </div>
                <Card>
                    <CardHeader className="gap-0">
                        <CardTitle className="text-lg m-0">
                            {title.split(" ").slice(2).join(" ")} Information
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
