import { listClasses, listYears } from "@/actions/roster/classes";
import { ClassList } from "@/components/roster/ClassList";

export default async function ClassesPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string }>;
}) {
    const { year } = await searchParams;
    const [yearsResult, classesResult] = await Promise.all([listYears(), listClasses(year)]);

    if (!yearsResult.success || !classesResult.success) {
        const error = !yearsResult.success ? yearsResult.error : (classesResult as { error: string }).error;
        return (
            <div className="mx-auto max-w-3xl">
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 px-6 py-5">
                    <p className="text-sm font-medium text-rose-900">Couldn&apos;t load your classes</p>
                    <p className="mt-1 text-xs text-rose-700/80">{error}</p>
                </div>
            </div>
        );
    }

    const activeYearId =
        classesResult.data[0]?.academicYearId ??
        yearsResult.data.find((y) => y.isCurrent)?.id ??
        yearsResult.data[0]?.id ??
        "";

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">Classes</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Your classes and who&apos;s in them. Students belong to a class for one session —
                    when they move up, their results move with them.
                </p>
            </div>

            <ClassList
                classes={classesResult.data}
                years={yearsResult.data}
                activeYearId={activeYearId}
            />
        </div>
    );
}
