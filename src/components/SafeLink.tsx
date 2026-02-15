"use client";

import React from "react";
import { useAntiCheat } from "@/components/AntiCheatGuard";

interface SafeLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

const SafeLink: React.FC<SafeLinkProps> = ({ href, children, className }) => {
    const { setSafeMode } = useAntiCheat();

    const handleClick = (e: React.MouseEvent) => {
        if (!setSafeMode) return;

        // Activate Safe Mode
        setSafeMode(true);
        console.log("Safe Mode Activated for External Link");

        // Auto-disable safe mode on return or timeout
        // 1. On Return (Focus)
        const restoreSafety = () => {
            setSafeMode(false);
            window.removeEventListener("focus", restoreSafety);
            console.log("Safe Mode Deactivated on Return");
        };
        window.addEventListener("focus", restoreSafety);

        // 2. Timeout Fallback (in case they never come back or focus logic fails)
        setTimeout(() => {
            setSafeMode(false);
            window.removeEventListener("focus", restoreSafety);
        }, 30000); // 30s grace period is generous for reading problem
    };

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={className}
        >
            {children}
        </a>
    );
};

export default SafeLink;
