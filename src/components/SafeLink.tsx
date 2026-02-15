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
        // Activate Safe Mode
        setSafeMode(true);
        console.log("Safe Mode Activated for External Link");

        // Optional: Set a timeout to auto-disable safe mode after some time (e.g. 1 minute)
        // or rely on user creating a "return" action.
        // For now, we rely on the context to re-arm when they come back? 
        // Actually, re-arming on focus return is handled by AntiCheatGuard logic if we want.
        // But currently safeModeRef stays true until set false.
        // We should arguably set it to false after a delay or let it be.

        // Strategy: We set it to true. The user goes to the tab.
        // When they come back, they are still in safe mode?
        // We probably want to disable safe mode on *return* (focus).
        // Let's attach a one-time focus listener here?
        // Or update AntiCheatGuard to auto-disable safe mode on focus gain?

        // For this implementation, we'll just enable it. 
        // The AntiCheatGuard doesn't auto-disable it yet.
        // Lets add a timeout to re-arm it after 5 seconds of being back? 
        // Or just let it be for now as per "Safe Mode" context.

        // Actually, looking at previous implementation, we just set it true.
        // Let's auto-disable it after 1 second? No, they need time to leave.

        // Better: Set it true. Add a window.onfocus listener to set it false.
        const restoreSafety = () => {
            setSafeMode(false);
            window.removeEventListener("focus", restoreSafety);
            console.log("Safe Mode Deactivated on Return");
        };
        window.addEventListener("focus", restoreSafety);
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
