"use client"

import DraftManager from "@/components/drafts/DraftManager"
import { MyQuestionsSection } from "@/components/drafts/MyQuestionsSection"

const DraftQuestion = () => {
    return (
        <div className="space-y-8">
            <section aria-labelledby="draft-papers-heading">
                <div className="mb-4">
                    <h1 id="draft-papers-heading" className="text-xl font-semibold tracking-tight text-zinc-900">
                        Draft Papers
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Organize questions into papers without changing your source question library.
                    </p>
                </div>
                <DraftManager />
            </section>
            <MyQuestionsSection />
        </div>
    )
}

export default DraftQuestion
