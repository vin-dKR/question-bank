/**
 * A small CSV reader for roster imports.
 *
 * Deliberately dependency-free. The awkward parts here aren't the grammar —
 * they are the two things that actually break real school exports:
 *
 *   1. ENCODING. Spreadsheets exported from Excel on Windows are frequently
 *      windows-1252, not UTF-8. Decoded as UTF-8 the bytes become U+FFFD and
 *      names arrive mangled — worse than a failed import, because it succeeds
 *      silently and somebody has to find it later.
 *
 *   2. QUOTING. "Kumar, Priya" must stay one field. A split on "," does not
 *      survive contact with a real roster.
 */

/**
 * Decodes a spreadsheet export, preferring UTF-8 and falling back to
 * windows-1252 when that produces replacement characters.
 */
export function decodeCsvBytes(buffer: ArrayBuffer): string {
    const utf8 = new TextDecoder("utf-8").decode(buffer);
    // U+FFFD means UTF-8 decoding hit bytes it couldn't interpret — the classic
    // signature of a windows-1252 file being read as UTF-8.
    if (!utf8.includes("�")) return utf8;

    try {
        return new TextDecoder("windows-1252").decode(buffer);
    } catch {
        // Some runtimes ship only the UTF-8 decoder. Better a few odd
        // characters than refusing the file outright.
        return utf8;
    }
}

/** Splits CSV text into rows of fields, honouring quotes and embedded newlines. */
export function parseCsv(text: string): string[][] {
    // Strip a UTF-8 BOM — Excel writes one, and it would otherwise become part
    // of the first header, so "Name" arrives as "﻿Name" and never matches.
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }  // escaped quote
                else inQuotes = false;
            } else {
                field += c;
            }
            continue;
        }

        if (c === '"') { inQuotes = true; continue; }
        if (c === ",") { row.push(field); field = ""; continue; }
        if (c === "\r") continue;                                  // CRLF
        if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
        field += c;
    }

    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

    return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export type ColumnRole = "name" | "rollNumber" | "admissionNumber" | "ignore";

/**
 * Guesses which column is which from the header row, so the common case needs
 * no manual mapping. Every guess stays editable.
 */
export function guessColumnRoles(header: string[]): ColumnRole[] {
    return header.map((raw) => {
        const h = raw.toLowerCase().replace(/[^a-z]/g, "");
        if (/^(roll|rollno|rollnumber|rno|srno|sno|serial)$/.test(h)) return "rollNumber";
        if (/^(admission|admissionno|admissionnumber|admno|enrollmentno|regno|registrationno)$/.test(h))
            return "admissionNumber";
        if (h.includes("name")) return "name";
        return "ignore";
    });
}
