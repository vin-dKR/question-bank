import { BarChart, Book, ClipboardList, FolderOpen, GraduationCap, Home, Layers, ScanLine, Settings, TestTube, Users } from "lucide-react";

export const sidebarItems: (SidebarItem | SidebarGroup)[] = [
    { name: "Dashboard", description: "View overview and metrics", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Questions", description: "Select questions to Print", href: "/questions", icon: <Book className="h-5 w-5" /> },
    { name: "Paper History", description: "Organize question categories", href: "/history", icon: <Layers className="h-5 w-5" /> },
    { name: "Folders", description: "Open saved question folders", href: "/drafts", icon: <FolderOpen className="h-5 w-5" /> },
    { name: "Question Templates", description: "Configure account settings", href: "/templates", icon: <Settings className="h-5 w-5" /> },
    { name: "School Test", description: "Extract questions from an image or PDF", href: "/school-test", icon: <GraduationCap className="h-5 w-5" /> },
    { name: "Classes", description: "Manage classes and student rosters", href: "/classes", icon: <Users className="h-5 w-5" /> },
    {
        name: "Examination",
        description: "Manage examinations",
        icon: <TestTube className="h-5 w-5" />,
        items: [
            { name: "All Tests", description: "View all tests", href: "/examination", icon: <ClipboardList className="h-4 w-4" /> },
            { name: "Create Test", description: "Create new test", href: "/examination/create", icon: <Book className="h-4 w-4" /> },
            { name: "OMR Checking", description: "Scan OMR sheets", href: "/examination/omr", icon: <ScanLine className="h-4 w-4" /> },
            { name: "Analysis", description: "View test analytics", href: "/examination/analytics", icon: <BarChart className="h-4 w-4" /> },
        ]
    },
];
