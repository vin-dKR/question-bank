/**
 * The dashboard shell has one navigation-mode boundary.
 *
 * Below this width navigation is a modal drawer. At and above it the sidebar is
 * persistent and may be collapsed. Keep page density independent of this value:
 * page layouts use the MainContent container's inline size instead.
 */
export const SHELL_DESKTOP_MIN_WIDTH = 1024;

export const SHELL_COMPACT_MEDIA_QUERY = `(max-width: ${SHELL_DESKTOP_MIN_WIDTH - 0.02}px)`;
