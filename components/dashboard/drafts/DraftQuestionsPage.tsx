"use client"

import DraftManager from "@/components/question/DraftManager"
import AppProviders from "@/components/providers/AppProviders"

const DraftQuestion = () => {
    return (
        <div className="relative">
            <AppProviders>
                <DraftManager />
            </AppProviders>
        </div>
    )
}

export default DraftQuestion
