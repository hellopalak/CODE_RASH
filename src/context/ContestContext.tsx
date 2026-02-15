"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface RoundStatus {
    id: 1 | 2 | 3 | 4;
    name: string;
    duration: number; // in seconds
    path: string;
    isLocked: boolean;
    isCompleted: boolean;
}

interface ContestContextType {
    currentTimeout: number; // remaining seconds for current round
    currentRoundId: number;
    completedRounds: number[];
    unlockNextRound: () => void;
    startContest: () => void;
    adminSetRound: (id: number) => void;
    adminSetTimer: (seconds: number) => void;
    adminResetContest: () => void;
}

const ContestContext = createContext<ContestContextType | null>(null);

export const useContest = () => {
    const context = useContext(ContestContext);
    if (!context) throw new Error("useContest must be used within ContestProvider");
    return context;
};

export const ContestProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();

    // Persisted State (could be localStorage)
    const [currentRoundId, setCurrentRoundId] = useState<number>(1);
    const [completedRounds, setCompletedRounds] = useState<number[]>([]);

    // Timers
    // Round 1: 15m (900s)
    // Round 2: 30m (1800s)
    // Round 3: 15m (900s)
    // Round 4: 2h (7200s)
    const ROUND_DURATIONS: Record<number, number> = {
        1: 900,
        2: 1800,
        3: 900,
        4: 7200
    };

    const [timer, setTimer] = useState(ROUND_DURATIONS[1]);
    const [isActive, setIsActive] = useState(false);

    // Initial Load / Sync & Cross-Tab Listener
    useEffect(() => {
        const loadState = () => {
            const savedRound = localStorage.getItem("contest_round");
            if (savedRound) {
                const rId = parseInt(savedRound, 10);
                setCurrentRoundId(rId);
                // Only reset timer if we moved rounds, otherwise keep running? 
                // For simplicity, we trust the local timer unless forced.
            }
        };
        loadState();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "contest_round") {
                loadState();
            }
            if (e.key === "contest_force_timer") {
                const newTime = parseInt(e.newValue || "0", 10);
                if (!isNaN(newTime)) setTimer(newTime);
            }
            if (e.key === "contest_reset_signal") {
                // Hard reset
                setCurrentRoundId(1);
                setTimer(ROUND_DURATIONS[1]);
                setCompletedRounds([]);
                localStorage.removeItem("contest_round");
                router.push("/round1");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    // Time's up!
                    handleRoundTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, currentRoundId]);

    const handleRoundTimeout = () => {
        // Auto-move to next round
        unlockNextRound();
    };

    const unlockNextRound = () => {
        setCompletedRounds(prev => [...prev, currentRoundId]);
        const nextRound = currentRoundId + 1;

        if (nextRound <= 4) {
            setCurrentRoundId(nextRound);
            setTimer(ROUND_DURATIONS[nextRound]);
            localStorage.setItem("contest_round", nextRound.toString());
            router.push(`/round${nextRound}`);
        } else {
            router.push("/dashboard"); // Or celebration
        }
    };

    const startContest = () => {
        setIsActive(true);
        // If not already on round 1, redirect
        if (pathname !== "/round1") router.push("/round1");
    };

    // Route Protection
    useEffect(() => {
        // If user tries to access round X but currentRoundId < X, redirect back
        if (pathname?.startsWith("/round")) {
            const roundNum = parseInt(pathname.replace("/round", ""), 10);
            if (!isNaN(roundNum)) {
                if (roundNum > currentRoundId) {
                    // Trying to skip ahead
                    router.push(`/round${currentRoundId}`);
                } else if (roundNum < currentRoundId) {
                    // Trying to go back (Locked)
                    // Unless we want to allow reviewing? User said "locked".
                    router.push(`/round${currentRoundId}`);
                }
            }
        }
    }, [pathname, currentRoundId, router]);

    return (
        <ContestContext.Provider value={{
            currentTimeout: timer,
            currentRoundId,
            completedRounds,
            unlockNextRound,
            startContest,
            // Admin Helpers (Using localStorage as the message bus)
            adminSetRound: (id: number) => {
                localStorage.setItem("contest_round", id.toString());
                setCurrentRoundId(id);
                setTimer(ROUND_DURATIONS[id]);
                window.dispatchEvent(new Event("storage")); // Trigger local update too if needed logic
            },
            adminSetTimer: (seconds: number) => {
                localStorage.setItem("contest_force_timer", seconds.toString());
                setTimer(seconds);
            },
            adminResetContest: () => {
                localStorage.setItem("contest_reset_signal", Date.now().toString());
                setCurrentRoundId(1);
                setTimer(ROUND_DURATIONS[1]);
                setCompletedRounds([]);
            }
        }}>
            {children}
        </ContestContext.Provider>
    );
};
