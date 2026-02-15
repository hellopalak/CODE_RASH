"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc, Timestamp, getDoc } from "firebase/firestore";

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
    adminSetRound: (id: number) => Promise<void>;
    adminSetTimer: (seconds: number) => Promise<void>;
    adminResetContest: () => Promise<void>;
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

    const [currentRoundId, setCurrentRoundId] = useState<number>(1);
    const [completedRounds, setCompletedRounds] = useState<number[]>([]);
    const [timer, setTimer] = useState(900); // Default 15m
    const [roundEndTime, setRoundEndTime] = useState<number | null>(null);

    // Round Durations
    const ROUND_DURATIONS: Record<number, number> = {
        1: 900,
        2: 1800,
        3: 900,
        4: 7200
    };

    // --- 1. SYNC WITH FIRESTORE & PRESENCE HEARTBEAT ---
    useEffect(() => {
        // A. Global State Sync
        const unsubGlobal = onSnapshot(doc(db, "contest", "global_state"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.currentRoundId) {
                    setCurrentRoundId(data.currentRoundId);
                    localStorage.setItem("contest_round", data.currentRoundId.toString());
                }
                if (data.roundEndTime) {
                    setRoundEndTime(data.roundEndTime.toMillis());
                }
            }
        });

        // B. User Presence / Heartbeat
        let heartbeatInterval: NodeJS.Timeout;
        const myEmail = localStorage.getItem("contest_user_email");

        if (myEmail) {
            const userDocRef = doc(db, "users", myEmail);

            // 1. Initial "Online" Status
            const setOnline = async () => {
                try {
                    // Try to get team/name from allowed_users if possible, but basic info first
                    await setDoc(userDocRef, {
                        id: myEmail,
                        name: myEmail.split("@")[0], // Fallback name
                        status: "Online",
                        lastActive: Timestamp.now(),
                        round: currentRoundId // Track which round they are on
                    }, { merge: true });
                } catch (e) {
                    console.error("Presence Error:", e);
                }
            };
            setOnline();

            // 2. Heartbeat (Every 30s)
            heartbeatInterval = setInterval(async () => {
                try {
                    await updateDoc(userDocRef, {
                        lastActive: Timestamp.now(),
                        status: "Online"
                    });
                } catch (e) {
                    // Start fresh if doc deleted or network issue
                    setOnline();
                }
            }, 30000);
        }

        return () => {
            unsubGlobal();
            if (heartbeatInterval) clearInterval(heartbeatInterval);

            // Optional: Set Offline on unmount (refresh/close)
            if (myEmail) {
                // We use Beacon API for reliability on close, but basic firestore here helps
                // Note: This might flap on simple nav, but Next.js SPA nav doesn't unmount context usually.
                // updateDoc(doc(db, "users", myEmail), { status: "Offline" }).catch(()=>{});
            }
        };
    }, []);

    // --- 1.5 SEPARATE HEARTBEAT (Depends on Round) ---
    useEffect(() => {
        const myEmail = localStorage.getItem("contest_user_email");
        if (!myEmail) return;

        const userDocRef = doc(db, "users", myEmail);

        // Update Round Progress & Team Name
        const updateProgress = async () => {
            try {
                // Fetch Team Name from Allowlist if not known (Optimization: could cache in local)
                let teamName = "Unknown";
                try {
                    const allowDoc = await getDoc(doc(db, "allowed_users", myEmail));
                    if (allowDoc.exists()) {
                        teamName = allowDoc.data().teamName || "Unknown";
                    }
                } catch (err) { console.error("Error fetching team", err); }

                await setDoc(userDocRef, {
                    id: myEmail,
                    name: myEmail.split("@")[0],
                    team: teamName, // Added Team
                    status: "Online",
                    lastActive: Timestamp.now(),
                    round: currentRoundId
                }, { merge: true });
            } catch (e) { console.error("Heartbeat error", e); }
        };

        // Run once immediately
        updateProgress();

        // Keep Alive Interval
        const interval = setInterval(() => updateProgress(), 30000);
        return () => clearInterval(interval);
    }, [currentRoundId]);

    // --- 2. LOCAL TICKER (Derived from EndTime) ---
    useEffect(() => {
        if (!roundEndTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));

            setTimer(remaining);

            if (remaining <= 0) {
                // Timer finished
                handleRoundTimeout();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [roundEndTime]);

    const handleRoundTimeout = () => {
        // Auto-unlock logic is tricky with multiple clients.
        // We let the CLIENT unlock its own view, but we don't necessarily force the Server Round 
        // unless the Admin does it. 
        // OR: We just let the timer sit at 0 until Admin moves it.
        // For this app: We'll locally unlock the next route guard.
        if (!completedRounds.includes(currentRoundId)) {
            setCompletedRounds(prev => [...prev, currentRoundId]);
        }
    };

    const unlockNextRound = () => {
        // This is now mostly an Admin function or local "I'm done" function
        setCompletedRounds(prev => [...prev, currentRoundId]);

        // If it's a "User Finished" action, we might redirect them to wait.
        // If it's "Admin Force Next", the Firestore update handles the redirect via useEffect below.
    };

    // --- 3. AUTO-REDIRECT ON ROUND CHANGE ---
    useEffect(() => {
        // If we represent a "User" and the global round changes, we should probably follow it.
        // Logic: If I am on /round1 and global is /round2 -> Redirect /round2

        if (pathname?.startsWith("/round")) {
            const myRound = parseInt(pathname.replace("/round", ""), 10);
            if (myRound !== currentRoundId) {
                // If the global round moved AHEAD, pull the user forward.
                if (currentRoundId > myRound) {
                    router.push(`/round${currentRoundId}`);
                }
                // If global round moved BACK (Reset), pull user back.
                if (currentRoundId < myRound) {
                    router.push(`/round${currentRoundId}`);
                }
            }
        }
    }, [currentRoundId, pathname, router]);

    return (
        <ContestContext.Provider value={{
            currentTimeout: timer,
            currentRoundId,
            completedRounds,
            unlockNextRound,
            startContest: () => { }, // No longer needed with auto-sync

            // ADMIN ACTIONS (Write to Firestore)
            adminSetRound: async (id: number) => {
                const duration = ROUND_DURATIONS[id] || 900;
                // Calculate End Time: Now + Duration
                const endTime = new Date(Date.now() + duration * 1000);

                await setDoc(doc(db, "contest", "global_state"), {
                    currentRoundId: id,
                    roundEndTime: Timestamp.fromDate(endTime)
                }, { merge: true });
            },

            adminSetTimer: async (seconds: number) => {
                // Adjust End Time: Now + New Seconds
                const endTime = new Date(Date.now() + seconds * 1000);
                await updateDoc(doc(db, "contest", "global_state"), {
                    roundEndTime: Timestamp.fromDate(endTime)
                });
            },

            adminResetContest: async () => {
                // Reset to Round 1, 15m
                const endTime = new Date(Date.now() + 900 * 1000);
                await setDoc(doc(db, "contest", "global_state"), {
                    currentRoundId: 1,
                    roundEndTime: Timestamp.fromDate(endTime)
                });
            }
        }}>
            {children}
        </ContestContext.Provider>
    );
};
