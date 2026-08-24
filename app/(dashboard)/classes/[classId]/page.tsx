import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getClass } from "@/actions/roster/classes";
import { RosterTable } from "@/components/roster/RosterTable";

export default async function ClassDetailPage({
    params,
}: {
    params: Promise<{ classId: string }>;
}) {
    const { classId } = await params;
    const result = await getClass(classId);

    if (!result.success) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Link href="/classes" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
                    <ChevronLeft className="h-4 w-4" /> Classes
                </Link>
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 px-6 py-5">
                    <p className="text-sm font-medium text-rose-900">Couldn&apos;t open this class</p>
                    <p className="mt-1 text-xs text-rose-700/80">{result.error}</p>
                </div>
            </div>
        );
    }

    const detail = result.data;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link href="/classes" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
                    <ChevronLeft className="h-4 w-4" /> Classes
                </Link>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">
                    {detail.label}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    {detail.academicYearName} · {detail.studentCount} student
                    {detail.studentCount === 1 ? "" : "s"}
                </p>
            </div>

            <RosterTable detail={detail} />
        </div>
    );
}
