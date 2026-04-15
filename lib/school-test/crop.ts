import sharp from "sharp";
import type { Crop, Detection } from "./types";

/**
 * Crop every diagram detection out of the source page image.
 * Matches the Python cropper: 1% of image dim as padding, capped at 10 px.
 */
export async function cropDetections(
    pagePng: Buffer,
    width: number,
    height: number,
    detections: Detection[],
    pageNumber: number,
): Promise<Crop[]> {
    const padX = Math.min(Math.floor(width * 0.01), 10);
    const padY = Math.min(Math.floor(height * 0.01), 10);

    const crops: Crop[] = [];
    for (let i = 0; i < detections.length; i++) {
        const d = detections[i];
        if (!d.has_image || !d.bbox) continue;

        const [bx, by, bw, bh] = d.bbox;
        const x1 = Math.max(0, bx - padX);
        const y1 = Math.max(0, by - padY);
        const x2 = Math.min(width, bx + bw + padX);
        const y2 = Math.min(height, by + bh + padY);
        const cw = Math.max(1, x2 - x1);
        const ch = Math.max(1, y2 - y1);

        try {
            const buf = await sharp(pagePng)
                .extract({ left: x1, top: y1, width: cw, height: ch })
                .png()
                .toBuffer();
            crops.push({
                id: `p${pageNumber}-q${d.q_no}-crop${i}`,
                q_no: d.q_no,
                bbox: [x1, y1, cw, ch],
                dataUrl: `data:image/png;base64,${buf.toString("base64")}`,
            });
        } catch {
            // Skip crops that sharp rejects (e.g. out-of-bounds after rounding).
        }
    }
    return crops;
}
