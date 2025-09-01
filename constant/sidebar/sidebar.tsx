import { BarChart, Book, Home, Layers, Settings, TestTube } from "lucide-react";

export const sidebarItems: (SidebarItem | SidebarGroup)[] = [
    { name: "Dashboard", description: "View overview and metrics", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Questions", description: "Select questions to Print", href: "/questions", icon: <Book className="h-5 w-5" /> },
    { name: "Paper History", description: "Organize question categories", href: "/history", icon: <Layers className="h-5 w-5" /> },
    { name: "Drats Questions", description: "Analyze performance data", href: "/drafts", icon: <BarChart className="h-5 w-5" /> },
    { name: "Question Templates", description: "Configure account settings", href: "/templates", icon: <Settings className="h-5 w-5" /> },
    {
        name: "Examination",
        description: "Manage examinations",
        icon: <TestTube className="h-5 w-5" />,
        items: [
            { name: "All Tests", description: "View all tests", href: "/examination", icon: <BarChart className="h-4 w-4" /> },
            { name: "Create Test", description: "Create new test", href: "/examination/create", icon: <Book className="h-4 w-4" /> },
        ]
    },
];
