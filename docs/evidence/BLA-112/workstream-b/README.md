# BLA-112 Workstream B browser evidence

Captured on 2026-08-30 with Chromium through `agent-browser`.

- Before: audit commit `5f8e4b654b1ab621af5a5d5a65a602f088aff812`
- After: Workstream B implementation in this commit
- Harness: temporary public evidence route rendering the real shared Button, Input, Checkbox, and Dialog primitives; the route was removed after capture
- Matrix: phone portrait 390×844, phone landscape 667×375, tablet 768×1024, desktop 1366×768
- All measured documents reported zero horizontal overflow

## Measured outcomes

| Viewport | Before controls | After controls | Before dialog | After dialog |
|---|---|---|---|---|
| 390×844 | Primary 40px; icon 32px; input 36px/14px; checkbox 16px | Primary/icon/input/checkbox 44px; input text 16px | Surface spans y=-192…1036; header, footer, and 16px close target outside viewport | Surface spans y=16…828; header/footer visible; body scrolls 584/1104px; close target 44px |
| 667×375 | Primary 40px; icon 32px; input 36px; checkbox 16px | Primary/icon/input/checkbox 44px; input text 16px | Surface spans y=-140.5…515.5; header/footer/close outside viewport | Surface spans y=16…359; header/footer visible; body scrolls 171/544px; close target 44px |
| 768×1024 | Fine-pointer controls retain 40/32/36/16px desktop density | Fine-pointer controls retain desktop density | Header/footer visible; close target 16px | Header/footer visible; close target 44px |
| 1366×768 | Fine-pointer controls retain 40/32/36/16px desktop density | Fine-pointer controls retain desktop density | Header/footer visible; close target 16px | Header/footer visible; close target 44px |

The after-state phone checks demonstrate the no-focus-zoom contract: both shared and raw text inputs compute to 16 CSS px at 390×844 and 667×375. At tablet/desktop widths, fine-pointer controls retain the existing compact typography and geometry. The shared CSS also raises hit areas at larger widths when `(pointer: coarse)` or `(any-pointer: coarse)` matches.

The final production-bundle smoke check, after removing the harness, reported no error overlay and zero document overflow at 390×844 and 1366×768. Visible landing-page shared buttons measured at least 44px high on the phone; fine-pointer desktop navigation retained its existing 36px density.

## Screenshots

### Phone portrait — 390×844

- [Before controls](before-phone-portrait-controls-390x844.png)
- [After controls](after-phone-portrait-controls-390x844.png)
- [Before dialog](before-phone-portrait-dialog-390x844.png)
- [After dialog](after-phone-portrait-dialog-390x844.png)

### Phone landscape — 667×375

- [Before controls](before-phone-landscape-controls-667x375.png)
- [After controls](after-phone-landscape-controls-667x375.png)
- [Before dialog](before-phone-landscape-dialog-667x375.png)
- [After dialog](after-phone-landscape-dialog-667x375.png)

### Tablet — 768×1024

- [Before controls](before-tablet-controls-768x1024.png)
- [After controls](after-tablet-controls-768x1024.png)
- [Before dialog](before-tablet-dialog-768x1024.png)
- [After dialog](after-tablet-dialog-768x1024.png)

### Desktop — 1366×768

- [Before controls](before-desktop-controls-1366x768.png)
- [After controls](after-desktop-controls-1366x768.png)
- [Before dialog](before-desktop-dialog-1366x768.png)
- [After dialog](after-desktop-dialog-1366x768.png)

Raw DOM measurements are in [measurements.json](measurements.json).

This evidence covers Workstream B only and does not mark BLA-112 complete.
