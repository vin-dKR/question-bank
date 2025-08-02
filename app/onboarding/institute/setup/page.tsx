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

export default function CoachingSetupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        centerName: "",
        contactPerson: "",
        email: "",
        phone: "",
        location: "",
        teacherCount: "",
        studentCount: "",
        targetExams: [] as string[],
    })

    const exams = [
        { id: "jee-main", label: "JEE Main" },
        { id: "jee-advanced", label: "JEE Advanced" },
        { id: "neet", label: "NEET" },
        { id: "boards", label: "Board Exams" },
        { id: "foundation", label: "Foundation Courses" },
    ]

    const handleExamChange = (examId: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            targetExams: checked ? [...prev.targetExams, examId] : prev.targetExams.filter((e) => e !== examId),
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-4xl px-6">
                <div className="mb-12">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4 bg-black/4 border border-black/5">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Set up your coaching center</h1>
                    <p className="mt-2 text-gray-600">
                        Tell us about your coaching center so we can provide enterprise-level features and support.
                    </p>
                </div>

                <Card>
                    <CardHeader className="gap-0">
                        <CardTitle className="text-lg m-0">Coaching Center Information</CardTitle>
                        <CardDescription>This helps us set up the right features for your institution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="center-name">Coaching Center Name</Label>
                                <Input
                                    id="center-name"
                                    value={formData.centerName}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, centerName: e.target.value }))}
                                    placeholder="Enter your coaching center name"
                                    required
                                    className="border border-black/10"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact-person">Contact Person</Label>
                                    <Input
                                        id="contact-person"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                                        placeholder="Enter contact person name"
                                        required
                                        className="border border-black/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Enter phone number"
                                        required
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter email address"
                                        required
                                        className="border border-black/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                                        placeholder="City, State"
                                        required
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="teacher-count">Number of Teachers</Label>
                                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, teacherCount: value }))}>
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            <SelectItem value="1-5">1-5 teachers</SelectItem>
                                            <SelectItem value="6-15">6-15 teachers</SelectItem>
                                            <SelectItem value="16-30">16-30 teachers</SelectItem>
                                            <SelectItem value="30+">30+ teachers</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="student-count">Number of Students</Label>
                                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, studentCount: value }))}>
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            <SelectItem value="1-100">1-100 students</SelectItem>
                                            <SelectItem value="101-500">101-500 students</SelectItem>
                                            <SelectItem value="501-1000">501-1000 students</SelectItem>
                                            <SelectItem value="1000+">1000+ students</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Target Exams</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {exams.map((exam) => (
                                        <div key={exam.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={exam.id}
                                                checked={formData.targetExams.includes(exam.id)}
                                                onCheckedChange={(checked) => handleExamChange(exam.id, checked as boolean)}
                                            />
                                            <Label htmlFor={exam.id} className="text-sm font-normal">
                                                {exam.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit" size="lg" className="bg-black text-white rounded-xl">
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
