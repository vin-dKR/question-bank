"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuestionsData } from "@/hooks/dashboard/questionsData";

export default function Dashboard() {
    const [activeUsers] = useState(0);

    const totalQuestions = useQuestionsData()
    console.log(totalQuestions)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Total Questions</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalQuestions}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Active Users</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Quick Actions</h3>
                <p className="text-gray-600 mt-2">Add new question or category</p>
                <Button className="mt-4 bg-black text-white">Add Question</Button>
            </div>
            <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-medium text-gray-700">Recent Activities</h3>
                <ul className="mt-2 text-gray-600">
                    <li>Added 5 questions to Physics - 5 mins ago</li>
                    <li>Updated user profile - 1 hour ago</li>
                </ul>
            </div>
        </div>
    );
}
