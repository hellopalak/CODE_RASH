"use client";

import React, { useEffect, useState } from "react";

interface Star {
    id: number;
    top: string;
    left: string;
    size: number;
    duration: string;
    delay: string;
}

const StarBackground: React.FC = () => {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        const generateStars = () => {
            const newStars: Star[] = [];
            const count = 100; // Number of stars

            for (let i = 0; i < count; i++) {
                newStars.push({
                    id: i,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    size: Math.random() * 2 + 1, // 1px to 3px
                    duration: `${Math.random() * 3 + 2}s`, // 2s to 5s
                    delay: `${Math.random() * 5}s`,
                });
            }
            setStars(newStars);
        };

        generateStars();
    }, []);

    return (
        <div className="night-sky">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDuration: star.duration,
                        animationDelay: star.delay,
                    }}
                />
            ))}
            {/* Optional Moon if you want it here, but maybe keep it separate or check if global CSS handles it */}
            <div className="moon"></div>
        </div>
    );
};

export default StarBackground;
