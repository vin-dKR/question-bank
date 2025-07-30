import React from 'react';
import { ReactSVG } from 'react-svg';

const AnimatedSVG = () => {
    return (
        <ReactSVG
            src="/clock.svg" // Path to your SVG file
            beforeInjection={(svg) => {
                // Optional: Modify the SVG before it is injected
                svg.setAttribute('style', 'width: 600px; height: 600px;'); // Adjust size
            }}
        />
    );
};

export default AnimatedSVG;
