"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function TeacherSetupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        school: "",
        subjects: [] as string[],
        experience: "",
        studentCount: "",
    })

    const subjects = [
        { id: "physics", label: "Physics" },
        { id: "chemistry", label: "Chemistry" },
        { id: "mathematics", label: "Mathematics" },
        { id: "biology", label: "Biology" },
        { id: "english", label: "English" },
        { id: "hindi", label: "Hindi" },
    ]

    const handleSubjectChange = (subjectId: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            subjects: checked ? [...prev.subjects, subjectId] : prev.subjects.filter((s) => s !== subjectId),
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-2xl px-6">
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Set up your teacher profile</h1>
                    <p className="mt-2 text-gray-600">
                        Help us understand your teaching needs so we can provide the best question recommendations.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Teaching Information</CardTitle>
                        <CardDescription>This helps us customize your question bank and test templates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="school">School/Institution Name</Label>
                                <Input
                                    id="school"
                                    value={formData.school}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, school: e.target.value }))}
                                    placeholder="Enter your school or institution name"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Teaching Experience</Label>
                                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, experience: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select experience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0-2">0-2 years</SelectItem>
                                            <SelectItem value="3-5">3-5 years</SelectItem>
                                            <SelectItem value="6-10">6-10 years</SelectItem>
                                            <SelectItem value="10+">10+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="student-count">Number of Students</Label>
                                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, studentCount: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-20">1-20 students</SelectItem>
                                            <SelectItem value="21-50">21-50 students</SelectItem>
                                            <SelectItem value="51-100">51-100 students</SelectItem>
                                            <SelectItem value="100+">100+ students</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Subjects you teach</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {subjects.map((subject) => (
                                        <div key={subject.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={subject.id}
                                                checked={formData.subjects.includes(subject.id)}
                                                onCheckedChange={(checked) => handleSubjectChange(subject.id, checked as boolean)}
                                            />
                                            <Label htmlFor={subject.id} className="text-sm font-normal">
                                                {subject.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit" size="lg">
                                    Complete Setup
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
