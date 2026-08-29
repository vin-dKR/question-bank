/**
 * Vector geometry for the extended shape library.
 *
 * Each shape is drawn in a 100×100 box and stretched to the element's real size
 * with `preserveAspectRatio="none"`, so a wide star still fills a wide box — the
 * same way PowerPoint scales its auto-shapes. The names match `ShapeKind` (and
 * therefore pptxgenjs `ShapeType`) one-to-one, so the on-screen SVG and the
 * exported .pptx are the same shape.
 */
import type { Gradient, ShapeKind } from "@/types/slides";

export type ShapeGeometry =
    | { kind: "polygon"; points: string }
    | { kind: "path"; d: string };

export const SHAPE_GEOMETRY: Record<ShapeKind, ShapeGeometry> = {
    triangle: { kind: "polygon", points: "50,4 96,96 4,96" },
    rtTriangle: { kind: "polygon", points: "4,4 4,96 96,96" },
    diamond: { kind: "polygon", points: "50,3 97,50 50,97 3,50" },
    parallelogram: { kind: "polygon", points: "24,12 97,12 76,88 3,88" },
    trapezoid: { kind: "polygon", points: "24,14 76,14 96,86 4,86" },
    pentagon: { kind: "polygon", points: "50,3 96,37 78,92 22,92 4,37" },
    hexagon: { kind: "polygon", points: "25,6 75,6 97,50 75,94 25,94 3,50" },
    octagon: { kind: "polygon", points: "31,4 69,4 96,31 96,69 69,96 31,96 4,69 4,31" },
    star4: { kind: "polygon", points: "50,2 61,39 98,50 61,61 50,98 39,61 2,50 39,39" },
    star5: {
        kind: "polygon",
        points: "50,2 61,38 98,38 68,60 79,96 50,74 21,96 32,60 2,38 39,38",
    },
    star6: {
        kind: "polygon",
        points: "50,2 61,32 93,25 72,50 93,75 61,68 50,98 39,68 7,75 28,50 7,25 39,32",
    },
    rightArrow: { kind: "polygon", points: "2,32 62,32 62,10 98,50 62,90 62,68 2,68" },
    leftArrow: { kind: "polygon", points: "98,32 38,32 38,10 2,50 38,90 38,68 98,68" },
    upArrow: { kind: "polygon", points: "32,98 32,38 10,38 50,2 90,38 68,38 68,98" },
    downArrow: { kind: "polygon", points: "32,2 32,62 10,62 50,98 90,62 68,62 68,2" },
    chevron: { kind: "polygon", points: "2,10 56,10 98,50 56,90 2,90 44,50" },
    homePlate: { kind: "polygon", points: "2,10 68,10 98,50 68,90 2,90" },
    plus: {
        kind: "polygon",
        points: "36,4 64,4 64,36 96,36 96,64 64,64 64,96 36,96 36,64 4,64 4,36 36,36",
    },
    heart: {
        kind: "path",
        d: "M50,88 C10,58 2,32 25,20 C41,11 50,26 50,32 C50,26 59,11 75,20 C98,32 90,58 50,88 Z",
    },
    cloud: {
        kind: "path",
        d: "M30,80 C15,80 9,62 22,54 C17,39 39,31 47,44 C51,29 76,31 75,48 C90,45 92,70 77,73 C77,83 41,87 30,80 Z",
    },
};

export interface ShapeMeta {
    kind: ShapeKind;
    label: string;
}

/** The order shapes appear in the Insert palette. */
export const SHAPE_LIBRARY: ShapeMeta[] = [
    { kind: "rightArrow", label: "Right arrow" },
    { kind: "leftArrow", label: "Left arrow" },
    { kind: "upArrow", label: "Up arrow" },
    { kind: "downArrow", label: "Down arrow" },
    { kind: "triangle", label: "Triangle" },
    { kind: "rtTriangle", label: "Right triangle" },
    { kind: "diamond", label: "Diamond" },
    { kind: "parallelogram", label: "Parallelogram" },
    { kind: "trapezoid", label: "Trapezoid" },
    { kind: "pentagon", label: "Pentagon" },
    { kind: "hexagon", label: "Hexagon" },
    { kind: "octagon", label: "Octagon" },
    { kind: "chevron", label: "Chevron" },
    { kind: "homePlate", label: "Pentagon arrow" },
    { kind: "plus", label: "Plus" },
    { kind: "star4", label: "4-point star" },
    { kind: "star5", label: "5-point star" },
    { kind: "star6", label: "6-point star" },
    { kind: "heart", label: "Heart" },
    { kind: "cloud", label: "Cloud" },
];

/**
 * CSS for a gradient background/preview. Our angle is measured clockwise from the
 * positive x-axis (0 = left→right, 90 = top→bottom); CSS `linear-gradient` measures
 * 0deg = "to top" and 90deg = "to right", so we add 90 to convert.
 */
export function gradientCss(g: Gradient): string {
    return `linear-gradient(${g.angle + 90}deg, ${g.from}, ${g.to})`;
}

/**
 * Browser-only: rasterise a gradient to a small PNG data URL. Stored as the slide's
 * `bgImage` so the .pptx exporter — which cannot draw a gradient natively — paints
 * an identical full-bleed picture. A tiny tile is enough; a smooth gradient shows no
 * artefacts when stretched to full slide size.
 */
export function gradientToDataUrl(g: Gradient, w = 128, h = 72): string {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const rad = (g.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const grad = ctx.createLinearGradient(
        w / 2 - (cos * w) / 2,
        h / 2 - (sin * h) / 2,
        w / 2 + (cos * w) / 2,
        h / 2 + (sin * h) / 2
    );
    grad.addColorStop(0, g.from);
    grad.addColorStop(1, g.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return canvas.toDataURL("image/png");
}
