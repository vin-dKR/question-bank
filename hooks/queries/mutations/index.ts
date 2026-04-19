/**
 * Phase 7 — question-bank mutation hooks.
 *
 * Thin `useMutation` wrappers around the server actions under
 * `actions/question/` + `lib/ai/aiService.ts`. Each hook owns its own
 * optimistic-update + rollback strategy and invalidates only the minimum
 * query keys required to resync after a write.
 */
export { useUpdateQuestion } from "./useUpdateQuestion";
export type { UpdateQuestionInput } from "./useUpdateQuestion";

export { useUpdateQuestionForm } from "./useUpdateQuestionForm";
export type { UpdateQuestionFormInput } from "./useUpdateQuestionForm";

export { useCreateQuestion } from "./useCreateQuestion";
export type { CreateQuestionInput } from "./useCreateQuestion";

export { useDeleteQuestion } from "./useDeleteQuestion";
export type { DeleteQuestionInput } from "./useDeleteQuestion";

export { useToggleQuestionFlag } from "./useToggleQuestionFlag";
export type { ToggleQuestionFlagInput } from "./useToggleQuestionFlag";

export { useRefineQuestionText } from "./useRefineQuestionText";
export type { RefineQuestionTextInput } from "./useRefineQuestionText";
