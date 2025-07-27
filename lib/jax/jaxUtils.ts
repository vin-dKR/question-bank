export async function loadMathJax(timeoutMs = 15000): Promise<boolean> {
    return new Promise((resolve) => {
        // Check if MathJax is already loaded and ready
        if (window.MathJax && window.MathJax.typesetPromise) {
            // For subsequent renders, we need to check if MathJax is actually ready
            // The startup state might not be reliable, so we'll test with a simple typeset
            try {
                // Test if MathJax is actually working by trying to typeset a simple expression
                const testElement = document.createElement('div');
                testElement.innerHTML = '\\(x\\)';
                testElement.style.position = 'absolute';
                testElement.style.left = '-9999px';
                testElement.style.top = '-9999px';
                document.body.appendChild(testElement);

                window.MathJax.typesetPromise([testElement]).then(() => {
                    document.body.removeChild(testElement);
                    console.log('MathJax already loaded and working');
                    resolve(true);
                }).catch(() => {
                    document.body.removeChild(testElement);
                    console.log('MathJax loaded but not working, reinitializing...');
                    // MathJax is loaded but not working, we need to reinitialize
                    resolve(false);
                });
                return;
            } catch (error) {
                console.log('MathJax test failed, reinitializing...');
                resolve(false);
                return;
            }
        }

        // Set up timeout
        const timeout = setTimeout(() => {
            console.warn('MathJax loading timeout, proceeding without LaTeX rendering');
            resolve(false);
        }, timeoutMs);

        // Check for MathJax loading with better state checking
        const checkMathJax = () => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                // Test if MathJax is actually working
                try {
                    const testElement = document.createElement('div');
                    testElement.innerHTML = '\\(x\\)';
                    testElement.style.position = 'absolute';
                    testElement.style.left = '-9999px';
                    testElement.style.top = '-9999px';
                    document.body.appendChild(testElement);

                    window.MathJax.typesetPromise([testElement]).then(() => {
                        document.body.removeChild(testElement);
                        clearTimeout(timeout);
                        console.log('MathJax loaded and working');
                        resolve(true);
                    }).catch(() => {
                        document.body.removeChild(testElement);
                        setTimeout(checkMathJax, 100);
                    });
                } catch (error) {
                    setTimeout(checkMathJax, 100);
                }
            } else {
                // MathJax not loaded yet, keep checking
                setTimeout(checkMathJax, 100);
            }
        };

        checkMathJax();
    });
}



/**
 * Initialize MathJax if not already loaded
 */
export function initializeMathJax(): void {
    if (typeof window === 'undefined') return;

    const existingScript = document.getElementById('MathJax-script');
    if (existingScript && window.MathJax) {
        console.log('MathJax already loaded');
        return;
    }

    window.MathJax = {
        tex: {
            inlineMath: [['\\(', '\\)'], ['$', '$']],
            displayMath: [['\\[', '\\]'], ['$$', '$$']],
            processEscapes: true,
            processEnvironments: true,
            processRefs: true
        },
        svg: {
            fontCache: 'global', // Use global font cache for consistency
            scale: 1,
            minScale: 0.5,
            mtextInheritFonts: true
        },
        options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
            enableMenu: false
        },
        startup: {
            pageReady: () => {
                console.log('MathJax is ready');
                return window.MathJax.startup.defaultPageReady();
            }
        }
    };

    if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'MathJax-script';
        script.async = true;
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'; // Use SVG output
        document.head.appendChild(script);
        console.log('MathJax script loaded');
    }
}

/**
 * Force proper math rendering for PDF generation
 */
export function forceInlineMath(): void {
    if (typeof window === 'undefined') return;

    // Fix all MathJax elements for PDF rendering
    const mathElements = document.querySelectorAll('[class*="MathJax"], mjx-container, mjx-math');
    mathElements.forEach(el => {
        if (el instanceof HTMLElement) {
            // Force inline display and proper alignment
            el.style.display = 'inline-block';
            el.style.margin = '0';
            el.style.padding = '0';
            el.style.verticalAlign = 'baseline';
            el.style.background = 'transparent';
            el.style.backgroundColor = 'transparent';

            // Fix SVG elements within MathJax
            const svgElements = el.querySelectorAll('svg');
            svgElements.forEach(svg => {
                if (svg instanceof SVGElement) {
                    svg.style.verticalAlign = 'baseline';
                    svg.style.background = 'transparent';
                    svg.style.backgroundColor = 'transparent';
                }
            });

            // Fix fraction lines and mathematical elements
            const fractionLines = el.querySelectorAll('.mjx-line, [data-mjx-texclass="ORD"]');
            fractionLines.forEach(line => {
                if (line instanceof HTMLElement) {
                    line.style.backgroundColor = '#000000';
                    line.style.height = '1px';
                }
            });
        }
    });

    console.log('Fixed math rendering for PDF generation:', mathElements.length, 'elements');
}

/**
 * Comprehensive fix for MathJax elements before PDF generation
 */
export async function fixMathJaxForPDF(container: HTMLElement): Promise<void> {
    if (typeof window === 'undefined') return;

    const mathElements = container.querySelectorAll('mjx-container, [class*="MathJax"]');
    mathElements.forEach(el => {
        if (el instanceof HTMLElement) {
            el.style.position = 'relative';
            el.style.display = 'inline-block';
            el.style.verticalAlign = 'middle';
            el.style.margin = '2px';
            el.style.padding = '0';
            el.style.background = 'transparent';
            el.style.backgroundColor = 'transparent';
            el.style.overflow = 'visible';
            el.style.maxWidth = '100%';

            const svgElements = el.querySelectorAll('svg');
            svgElements.forEach(svg => {
                if (svg instanceof SVGElement) {
                    svg.style.display = 'inline-block';
                    svg.style.verticalAlign = 'middle';
                    svg.style.color = '#000000';
                    svg.style.fill = '#000000';
                    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
            });

            const textElements = el.querySelectorAll('text, .mjx-char');
            textElements.forEach(text => {
                if (text instanceof SVGElement || text instanceof HTMLElement) {
                    text.style.fill = '#000000';
                    text.style.color = '#000000';
                }
            });
        }
    });

    console.log('Fixed MathJax for PDF:', mathElements.length, 'elements');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
}

/**
 * Reset MathJax state for consistent rendering
 */
export function resetMathJaxState(): void {
    if (typeof window === 'undefined') return;

    // Clear any existing MathJax elements
    const mathElements = document.querySelectorAll('[class*="MathJax"]');
    mathElements.forEach(el => {
        if (el instanceof HTMLElement) {
            el.remove();
        }
    });

    // Reset MathJax startup state if possible
    if (window.MathJax && window.MathJax.startup) {
        try {
            // Clear any pending processing
            if (window.MathJax.startup.document) {
                window.MathJax.startup.document.clear();
            }
        } catch (error) {
            console.log('Could not reset MathJax state:', error);
        }
    }

    console.log('MathJax state reset');
}


/**
* Debug function to check MathJax status and LaTeX rendering
*/
export function debugMathJaxStatus(): void {
    console.log('=== MathJax Debug Information ===');

    // Check if MathJax is loaded
    if (typeof window !== 'undefined') {
        console.log('Window object available:', !!window);
        console.log('MathJax loaded:', !!window.MathJax);

        if (window.MathJax) {
            console.log('MathJax version:', window.MathJax.version);
            console.log('MathJax startup ready:', !!window.MathJax.startup);
            console.log('MathJax typesetPromise available:', !!window.MathJax.typesetPromise);
            console.log('MathJax tex2svgPromise available:', !!window.MathJax.tex2svgPromise);

            if (window.MathJax.startup) {
                console.log('MathJax startup state:', window.MathJax.startup.document?.state());
            }
        } else {
            console.log('MathJax not loaded yet');
        }
    } else {
        console.log('Window object not available (server-side)');
    }

    console.log('=== End Debug Information ===');
}

/**
 * Test LaTeX rendering with a simple expression
 */
export async function testLatexRendering(latex: string = 'x^2 + y^2 = z^2'): Promise<boolean> {
    try {
        if (typeof window === 'undefined') {
            console.log('Cannot test LaTeX rendering on server-side');
            return false;
        }

        // Wait for MathJax to be available
        const mathJaxLoaded = await loadMathJax(5000);

        if (!mathJaxLoaded) {
            console.log('MathJax not available for testing');
            return false;
        }

        // Create a test element
        const testElement = document.createElement('div');
        testElement.innerHTML = `\\(${latex}\\)`;
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        testElement.style.top = '-9999px';
        document.body.appendChild(testElement);

        try {
            // Try to render the LaTeX
            await window.MathJax.typesetPromise([testElement]);
            console.log('LaTeX rendering test successful');

            // Check if MathJax actually rendered something
            const mathElements = testElement.querySelectorAll('[class*="MathJax"]');
            const success = mathElements.length > 0;

            console.log('MathJax elements found:', mathElements.length);

            // Clean up
            document.body.removeChild(testElement);

            return success;
        } catch (error) {
            console.error('LaTeX rendering test failed:', error);
            document.body.removeChild(testElement);
            return false;
        }
    } catch (error) {
        console.error('LaTeX rendering test setup failed:', error);
        return false;
    }
}