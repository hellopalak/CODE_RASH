"use client";

import { useState, useEffect } from "react";
import { useContest } from "@/context/ContestContext";
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { checkAccess } from "@/lib/allowlist";
import { ROUND1_QUESTIONS, ROUND3_QUESTIONS } from "@/lib/questions";

interface UserData {
    id: string;
    name: string;
    round: number;
    warnings: number;
    status: "Online" | "Offline" | "Disqualified" | "Kicked";
    score?: number;
    scores?: { round1?: number; round2?: number; round3?: number; round4?: number };
    team?: string;
}

export default function AdminDashboard() {
    const { currentRoundId, currentTimeout, adminSetRound, adminSetTimer, adminResetContest } = useContest();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "game" | "settings" | "questions">("dashboard");
    const [questionTab, setQuestionTab] = useState<"r1" | "r2" | "r3" | "r4">("r1");

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Questions State
    const [r1Questions, setR1Questions] = useState<any[]>([]);
    const [r3Questions, setR3Questions] = useState<any[]>([]);
    const [r2Problems, setR2Problems] = useState<any[]>([
        { id: "1", title: "Watermelon", difficulty: "800", link: "" },
        { id: "2", title: "Way Too Long Words", difficulty: "800", link: "" }
    ]);

    // Form States
    const [newQText, setNewQText] = useState("");
    const [newQOptions, setNewQOptions] = useState(["", "", "", ""]);
    const [newQAns, setNewQAns] = useState(0);
    const [newQCode, setNewQCode] = useState("");
    const [newQImage, setNewQImage] = useState<File | null>(null);
    const [newQImageUrl, setNewQImageUrl] = useState(""); // Cloudinary / external URL
    const [isUploading, setIsUploading] = useState(false);
    const [bulkJson, setBulkJson] = useState("");

    // Permission Error Helper
    const [permissionError, setPermissionError] = useState(false);
    // Round 4 Figma Link
    const [figmaLink, setFigmaLink] = useState("");
    const [figmaLinkInput, setFigmaLinkInput] = useState("");

    // --- CHECK AUTH ---
    useEffect(() => {
        // Load figma link from Firestore on mount
        const loadFigmaLink = async () => {
            try {
                const snap = await getDoc(doc(db, "contest_data", "round4"));
                if (snap.exists() && snap.data().figmaLink) {
                    setFigmaLink(snap.data().figmaLink);
                    setFigmaLinkInput(snap.data().figmaLink);
                }
            } catch (e) { console.error("Error loading figmaLink", e); }
        };
        loadFigmaLink();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Verify Admin Role
                const isAllowed = await checkAccess(user.email || "", "admin");
                if (isAllowed) {
                    setIsAuthenticated(true);
                } else {
                    alert("Access Denied: You are not an Admin.");
                    router.push("/login?role=admin");
                }
            } else {
                router.push("/login?role=admin");
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const fetchQuestions = async () => {
        if (!isAuthenticated) return;
        try {
            const r1Snap = await getDoc(doc(db, "contest_data", "round1"));
            if (r1Snap.exists()) setR1Questions(r1Snap.data().questions || []);
            else setR1Questions(ROUND1_QUESTIONS);

            const r3Snap = await getDoc(doc(db, "contest_data", "round3"));
            if (r3Snap.exists()) setR3Questions(r3Snap.data().questions || []);
            else setR3Questions(ROUND3_QUESTIONS);

            const r2Snap = await getDoc(doc(db, "contest_data", "round2"));
            if (r2Snap.exists() && r2Snap.data().problems) setR2Problems(r2Snap.data().problems);
        } catch (e: any) {
            console.error(e);
            if (e.code === "permission-denied") {
                setPermissionError(true);
            }
        }
    };

    useEffect(() => {
        if (activeTab === "questions" && isAuthenticated) fetchQuestions();
    }, [activeTab, isAuthenticated]);

    const handleAddQuestion = async (round: "r1" | "r3") => {
        setIsUploading(true);
        let imageUrl = newQImageUrl.trim(); // Prefer pasted URL (Cloudinary etc.)

        try {
            // Only upload file if no URL was pasted
            if (!imageUrl && newQImage) {
                const storageRef = ref(storage, `question_images/${Date.now()}_${newQImage.name}`);
                await uploadBytes(storageRef, newQImage);
                imageUrl = await getDownloadURL(storageRef);
            }

            const qData = {
                id: Date.now(),
                text: newQText,
                options: newQOptions,
                answer: newQAns,
                code: newQCode,
                image: imageUrl
            };

            const collectionName = round === "r1" ? "round1" : "round3";
            const currentList = round === "r1" ? r1Questions : r3Questions;
            const newList = [...currentList, qData];

            await setDoc(doc(db, "contest_data", collectionName), { questions: newList });
            if (round === "r1") setR1Questions(newList);
            else setR3Questions(newList);

            setNewQText("");
            setNewQOptions(["", "", "", ""]);
            setNewQAns(0);
            setNewQCode("");
            setNewQImage(null);
            setNewQImageUrl("");
            setIsUploading(false);
            alert("Question Added!");
        } catch (e: any) {
            console.error("Error adding question: ", e);
            if (e.code === 'permission-denied') setPermissionError(true);
            setIsUploading(false);
            alert("Error adding question: " + e.message);
        }
    };

    const handleBulkUpload = async (round: "r1" | "r3") => {
        try {
            let parsed: any[] = [];
            try {
                parsed = JSON.parse(bulkJson);
            } catch (e) {
                alert("Invalid JSON format. Please check your syntax.");
                return;
            }

            if (!Array.isArray(parsed)) {
                alert("JSON must be an array of objects.");
                return;
            }

            // Basic validation
            if (parsed.length > 0 && (!parsed[0].text || !parsed[0].options || parsed[0].answer === undefined)) {
                alert("Invalid question format. Must match: { text, options: [], answer: 0 }");
                return;
            }

            if (!confirm(`Overwrite existing questions with ${parsed.length} new questions?`)) return;

            const collectionName = round === "r1" ? "round1" : "round3";
            await setDoc(doc(db, "contest_data", collectionName), { questions: parsed });

            if (round === "r1") setR1Questions(parsed);
            else setR3Questions(parsed);

            setBulkJson("");
            alert("Bulk Upload Successful!");
        } catch (e: any) {
            console.error(e);
            if (e.code === 'permission-denied') setPermissionError(true);
            alert("Error uploading: " + e.message);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, round: "r1" | "r3") => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setBulkJson(text); // Load into text area for review
        };
        reader.readAsText(file);
    };

    const handleDeleteQuestion = async (round: "r1" | "r3", idx: number) => {
        if (!confirm("Delete this question?")) return;
        const collectionName = round === "r1" ? "round1" : "round3";
        const currentList = round === "r1" ? r1Questions : r3Questions;
        const newList = currentList.filter((_, i) => i !== idx);

        await setDoc(doc(db, "contest_data", collectionName), { questions: newList });
        if (round === "r1") setR1Questions(newList);
        else setR3Questions(newList);
    };

    const handleSaveR2 = async () => {
        await setDoc(doc(db, "contest_data", "round2"), { problems: r2Problems });
        alert("Round 2 Problems Saved!");
    };
    const [users, setUsers] = useState<UserData[]>([]);

    // Auth handled by top-level state now

    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [bulkEmails, setBulkEmails] = useState("");
    // Track which cells are locked: key = `${userId}-r2` or `${userId}-r4`
    const [lockedScores, setLockedScores] = useState<Record<string, boolean>>({});

    // --- Bulk Upload Logic ---
    const handleBulkAdd = async () => {
        if (!bulkEmails.trim()) {
            alert("Please paste some emails first.");
            return;
        }

        const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
        if (emails.length === 0) return;

        if (!confirm(`Add ${emails.length} users? This will create accounts in Firebase Auth and generate a CSV.`)) return;

        const credentials: { email: string, pass: string }[] = [];

        try {
            // 1. Generate local credentials
            for (const email of emails) {
                const pass = Math.random().toString(36).slice(-8);
                credentials.push({ email, pass });
            }

            // 2. Call API to create users in Firebase Auth
            // We send the list to the server so it can use firebase-admin
            const response = await fetch('/api/admin/create-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: credentials })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to create users");

            console.log("API Result:", result);

            // Check if any users failed
            const failedUsers = result.results?.filter((r: any) => r.status === 'failed');
            if (failedUsers?.length > 0) {
                console.error("Some users failed:", failedUsers);
                alert(`Warning: ${failedUsers.length} users failed to create.\nFirst error: ${failedUsers[0].error}`);
            }

            // 3. Save to Firestore 'allowed_users' (for reference/roles)
            // We still do this client-side or we could move it to API too.
            // Keeping it here is fine for now as we have logic for it.
            for (const cred of credentials) {
                await setDoc(doc(db, "allowed_users", cred.email), {
                    role: "user",
                    password: cred.pass
                });
            }

            // 4. Generate CSV
            const csvContent = "data:text/csv;charset=utf-8,"
                + "Email,Password\n"
                + credentials.map(c => `${c.email},${c.pass}`).join("\n"); // Handle case sensitivity if needed

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "code_rash_credentials.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`Successfully created ${emails.length} users! \n\n1. Accounts Created in Firebase.\n2. Added to Allowlist.\n3. CSV Downloaded.`);
            setBulkEmails("");

        } catch (e: any) {
            console.error(e);
            alert("Error adding users: " + e.message);
        }
    };

    // --- Real-Time User Sync ---
    const [tick, setTick] = useState(0); // Force re-render for offline status

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 30000); // Check every 30s
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const fetchedUsers: UserData[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();

                // Calculate Total Score
                let totalScore = 0;
                if (data.score) totalScore = data.score; // Legacy numeric support
                if (data.scores && typeof data.scores === 'object') {
                    totalScore = Object.values(data.scores).reduce((acc: number, curr: any) => acc + (typeof curr === 'number' ? curr : 0), 0);
                }

                // Check Heartbeat (Offline if > 60s ago)
                let computedStatus = data.status || "Offline";
                if (data.lastActive) {
                    const lastActiveTime = data.lastActive.toMillis ? data.lastActive.toMillis() : 0;
                    const now = Date.now();
                    if (now - lastActiveTime > 60000 && computedStatus === "Online") {
                        computedStatus = "Offline";
                    }
                }

                fetchedUsers.push({
                    id: doc.id,
                    name: data.name || "Unknown",
                    round: data.round || 0,
                    warnings: data.warnings || 0,
                    status: computedStatus,
                    score: totalScore,
                    team: data.team
                } as UserData);
            });

            // Sort by Score Descending
            fetchedUsers.sort((a, b) => (b.score || 0) - (a.score || 0));

            setUsers(fetchedUsers);
            setLastUpdated(new Date().toLocaleTimeString());
        });

        return () => unsub();
    }, [isAuthenticated]);

    // --- Authentication View ---
    if (!isAuthenticated) {
        return (
            <div style={{
                height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
                backgroundColor: "#212529", backgroundImage: "radial-gradient(#333 1px, transparent 1px)", backgroundSize: "20px 20px"
            }}>
                <div className="nes-container is-dark with-title is-centered" style={{ width: "400px" }}>
                    <p className="title">Admin Access</p>
                    <p>Verifying Credentials...</p>
                </div>
            </div>
        );
    }

    // --- Dashboard Actions ---
    const handleKick = async (id: string) => {
        if (confirm("Permanently ban this user?")) {
            await updateDoc(doc(db, "users", id), { status: "Kicked" });
        }
    };

    const handleForgive = async (id: string) => {
        if (confirm("Reset this user's warnings to 0?")) {
            await updateDoc(doc(db, "users", id), { warnings: 0 });
        }
    };

    const handleRestore = async (id: string) => {
        if (confirm("Restore this player back into the game? Their status will be set to Online.")) {
            await updateDoc(doc(db, "users", id), { status: "Online", warnings: 0 });
        }
    };




    const handleScoreUpdate = async (userId: string, roundKey: string, value: string) => {
        const score = parseInt(value);
        if (isNaN(score)) return;

        try {
            await updateDoc(doc(db, "users", userId), {
                [`scores.${roundKey}`]: score
            });
            // Lock the cell after saving
            const lockKey = roundKey === 'round2' ? `${userId}-r2` : `${userId}-r4`;
            setLockedScores(prev => ({ ...prev, [lockKey]: true }));
        } catch (e) {
            console.error("Error updating score:", e);
            alert("Failed to update score");
        }
    };

    const unlockScore = (userId: string, round: 'r2' | 'r4') => {
        const lockKey = `${userId}-${round}`;
        setLockedScores(prev => ({ ...prev, [lockKey]: false }));
    };

    const handleSaveFigmaLink = async () => {
        const url = figmaLinkInput.trim();
        if (!url) return;
        try {
            await setDoc(doc(db, "contest_data", "round4"), { figmaLink: url }, { merge: true });
            setFigmaLink(url);
            alert("Figma link saved! Players will see it when Round 4 is active.");
        } catch (e: any) {
            alert("Error saving link: " + e.message);
        }
    };

    const handleFactoryReset = async () => {
        if (!confirm("ARE YOU SURE? This will erase ALL player scores and round progress. This CANNOT be undone.")) return;
        if (!confirm("SECOND CONFIRMATION: All scores will be reset to 0 for every player. Proceed?")) return;

        try {
            // 1. Reset every user's scores and completedRoundIds in parallel
            const resetPromises = users.map(user =>
                updateDoc(doc(db, "users", user.id), {
                    scores: { round1: 0, round2: 0, round3: 0, round4: 0 },
                    completedRoundIds: [],
                    score: 0
                })
            );
            await Promise.all(resetPromises);

            // 2. Reset global contest state to Round 1
            await adminResetContest();

            // 3. Clear local lock state
            setLockedScores({});

            alert(`Factory Reset Complete! ${users.length} players reset to 0.`);
        } catch (e: any) {
            console.error("Factory Reset Error:", e);
            alert("Error during reset: " + e.message);
        }
    };

    // --- Layout ---
    return (
        <div style={{ display: "flex", height: "100vh", backgroundColor: "#212529", color: "#fff", fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif" }}>

            {/* ... Sidebar omitted for brevity, logic remains ... */}
            {/* Sidebar */}
            <aside style={{
                width: "260px", backgroundColor: "#000", borderRight: "4px solid #fff",
                display: "flex", flexDirection: "column", padding: "20px"
            }}>
                <h3 style={{ color: "#F7D51D", marginBottom: "30px", fontSize: "1.2rem", textAlign: "center", fontFamily: "'Press Start 2P', cursive" }}>CODE RASH<br /><span style={{ fontSize: "0.8rem", color: "#fff" }}>ADMIN</span></h3>

                <nav style={{ flex: 1 }}>
                    <button
                        className={`nes-btn ${activeTab === "dashboard" ? "is-primary" : ""}`}
                        onClick={() => setActiveTab("dashboard")}
                        style={{ width: "100%", marginBottom: "15px", textAlign: "left" }}
                    >
                        Dashboard
                    </button>
                    <button
                        className={`nes-btn ${activeTab === "users" ? "is-primary" : ""}`}
                        onClick={() => setActiveTab("users")}
                        style={{ width: "100%", marginBottom: "15px", textAlign: "left" }}
                    >
                        Users
                    </button>
                    <button
                        className={`nes-btn ${activeTab === "game" ? "is-primary" : ""}`}
                        onClick={() => setActiveTab("game")}
                        style={{ width: "100%", marginBottom: "15px", textAlign: "left" }}
                    >
                        Game Control
                    </button>
                    <button
                        className={`nes-btn ${activeTab === "questions" ? "is-primary" : ""}`}
                        onClick={() => setActiveTab("questions")}
                        style={{ width: "100%", marginBottom: "15px", textAlign: "left" }}
                    >
                        Questions Input
                    </button>
                    <button
                        className={`nes-btn ${activeTab === "settings" ? "is-primary" : ""}`}
                        onClick={() => setActiveTab("settings")}
                        style={{ width: "100%", marginBottom: "15px", textAlign: "left" }}
                    >
                        Success / Setup
                    </button>
                </nav>

                <div style={{ marginTop: "auto" }}>
                    <div className="nes-container is-rounded is-dark" style={{ padding: "10px", fontSize: "0.7rem", textAlign: "center" }}>
                        <p>Status: <span className="is-success">Online</span></p>
                        <p>Admin: Palak</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: "40px", overflowY: "auto", backgroundImage: "radial-gradient(#333 1px, transparent 1px)", backgroundSize: "20px 20px" }}>

                {/* Header */}
                <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", alignItems: "center" }}>
                    <h2 style={{ margin: 0 }}>{activeTab.toUpperCase()}</h2>
                    <button className="nes-btn is-error" onClick={() => auth.signOut()}>LOGOUT</button>
                </header>

                {/* Content Widgets */}
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                    {/* --- DASHBOARD VIEW --- */}
                    {activeTab === "dashboard" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                            {/* Stat Card 1 */}
                            <div className="nes-container is-dark with-title is-rounded">
                                <p className="title">Active Players</p>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <i className="nes-icon is-large heart"></i>
                                    <span style={{ fontSize: "2rem" }}>{users.filter(u => u.status === "Online").length}</span>
                                </div>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="nes-container is-dark with-title is-rounded">
                                <p className="title">Round Status</p>
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ fontSize: "1.5rem", color: "#F7D51D" }}>Round {currentRoundId}</p>
                                    <p>{Math.floor(currentTimeout / 60)}m {currentTimeout % 60}s</p>
                                </div>
                            </div>

                            {/* Stat Card 3 */}
                            <div className="nes-container is-dark with-title is-rounded">
                                <p className="title">System Health</p>
                                <p className="is-success" style={{ color: "#92cc41" }}>● All Systems Operational</p>
                                <p style={{ fontSize: "0.8rem", marginTop: "10px" }}>Firebase: Connected<br />Anti-Cheat: Active</p>
                            </div>
                        </div>
                    )}

                    {/* --- USERS VIEW --- */}
                    {activeTab === "users" && (
                        <div className="nes-container is-dark with-title">
                            <p className="title">
                                Player Management
                                <span style={{ fontSize: "0.6rem", marginLeft: "10px", color: "#92cc41", fontWeight: "normal" }}>
                                    (Live • Last Sync: {lastUpdated})
                                </span>
                            </p>
                            <div className="nes-table-responsive">
                                <table className="nes-table is-bordered is-dark" style={{ width: "100%", fontSize: "0.9rem" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: "10px" }}>ID</th>
                                            <th style={{ padding: "10px" }}>Player</th>
                                            <th style={{ padding: "10px" }}>Team</th>
                                            <th style={{ padding: "10px" }}>DSA (R2)</th>
                                            <th style={{ padding: "10px" }}>Dev (R4)</th>
                                            <th style={{ padding: "10px", color: "#00C853" }}>Total</th>
                                            <th style={{ padding: "10px" }}>Warnings</th>
                                            <th style={{ padding: "10px" }}>Status</th>
                                            <th style={{ padding: "10px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td style={{ fontSize: "0.75rem", padding: "10px" }}>{(user.id || "").substring(0, 6)}...</td>
                                                <td style={{ fontWeight: "bold", padding: "10px" }}>{user.name}</td>
                                                <td style={{ color: "#F7D51D", padding: "10px" }}>{user.team || "-"}</td>

                                                {/* DSA (R2) - Manual, Lockable */}
                                                <td style={{ padding: "5px" }}>
                                                    {(user.scores?.round2 !== undefined && user.scores.round2 > 0 && lockedScores[`${user.id}-r2`] !== false) ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                            <span style={{ color: "#92cc41", fontWeight: "bold" }}>🔒 {user.scores.round2}</span>
                                                            <button
                                                                className="nes-btn is-small"
                                                                style={{ padding: "2px 6px", fontSize: "0.6rem" }}
                                                                onClick={() => unlockScore(user.id, 'r2')}
                                                                title="Unlock to edit"
                                                            >✏️</button>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            key={`r2-${user.id}-${user.scores?.round2}`}
                                                            type="number"
                                                            className="nes-input is-dark"
                                                            style={{ width: "80px", padding: "5px", height: "auto" }}
                                                            defaultValue={user.scores?.round2 ?? 0}
                                                            onBlur={(e) => handleScoreUpdate(user.id, 'round2', e.target.value)}
                                                        />
                                                    )}
                                                </td>

                                                {/* Dev (R4) - Manual, Lockable */}
                                                <td style={{ padding: "5px" }}>
                                                    {(user.scores?.round4 !== undefined && user.scores.round4 > 0 && lockedScores[`${user.id}-r4`] !== false) ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                            <span style={{ color: "#92cc41", fontWeight: "bold" }}>🔒 {user.scores.round4}</span>
                                                            <button
                                                                className="nes-btn is-small"
                                                                style={{ padding: "2px 6px", fontSize: "0.6rem" }}
                                                                onClick={() => unlockScore(user.id, 'r4')}
                                                                title="Unlock to edit"
                                                            >✏️</button>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            key={`r4-${user.id}-${user.scores?.round4}`}
                                                            type="number"
                                                            className="nes-input is-dark"
                                                            style={{ width: "80px", padding: "5px", height: "auto" }}
                                                            defaultValue={user.scores?.round4 ?? 0}
                                                            onBlur={(e) => handleScoreUpdate(user.id, 'round4', e.target.value)}
                                                        />
                                                    )}
                                                </td>

                                                {/* Total Score */}
                                                <td style={{ color: "#00C853", padding: "10px", fontWeight: "bold", fontSize: "1.1em" }}>{user.score || 0}</td>

                                                <td style={{ padding: "10px" }}>
                                                    {user.warnings || 0}/3
                                                </td>
                                                <td style={{ padding: "10px" }}>
                                                    {user.status === "Online" && <span className="nes-text is-success">Online</span>}
                                                    {user.status === "Disqualified" && <span className="nes-text is-error">DQ'd</span>}
                                                    {user.status === "Offline" && <span className="nes-text is-disabled">Offline</span>}
                                                    {user.status === "Kicked" && <span className="nes-text is-error">BANNED</span>}
                                                </td>
                                                <td style={{ padding: "10px" }}>
                                                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                                        <button
                                                            className="nes-btn is-error is-small"
                                                            disabled={user.status === "Kicked"}
                                                            onClick={() => handleKick(user.id)}
                                                            title="Ban User"
                                                            style={{ padding: "5px 10px" }}
                                                        >
                                                            BAN
                                                        </button>
                                                        {(user.status === "Kicked" || user.status === "Disqualified") && (
                                                            <button
                                                                className="nes-btn is-success is-small"
                                                                onClick={() => handleRestore(user.id)}
                                                                title="Restore player"
                                                                style={{ padding: "5px 10px" }}
                                                            >
                                                                ↩ RST
                                                            </button>
                                                        )}
                                                        <button
                                                            className="nes-btn is-warning is-small"
                                                            disabled={!user.warnings || user.warnings === 0}
                                                            onClick={() => handleForgive(user.id)}
                                                            title="Reset Warnings"
                                                            style={{ padding: "5px 10px" }}
                                                        >
                                                            RST
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={9} style={{ textAlign: "center" }}>Waiting for players...</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- GAME CONTROL VIEW --- */}
                    {activeTab === "game" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>

                            {/* Round Control */}
                            <div className="nes-container is-dark with-title">
                                <p className="title">Global Round Control</p>
                                <p style={{ marginBottom: "20px", color: "orange" }}>⚠ CAUTION: Changing rounds affects ALL players immediately.</p>

                                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                                    {[1, 2, 3, 4].map(r => (
                                        <button
                                            key={r}
                                            className={`nes-btn ${currentRoundId === r ? "is-success" : ""}`}
                                            onClick={() => adminSetRound(r)}
                                        >
                                            {currentRoundId === r ? "ACTIVE: " : "START "} ROUND {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timer Control */}
                            <div className="nes-container is-dark with-title">
                                <p className="title">Timer Override</p>
                                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                    <div style={{ fontSize: "2rem", color: "#F7D51D" }}>
                                        {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button className="nes-btn" onClick={() => adminSetTimer(currentTimeout + 60)}>+1m</button>
                                        <button className="nes-btn" onClick={() => adminSetTimer(currentTimeout - 60)}>-1m</button>
                                        <button className="nes-btn is-warning" onClick={() => adminSetTimer(15)}>END ROUND (15s)</button>
                                    </div>
                                </div>
                            </div>


                            {/* Emergency Zone */}
                            <div className="nes-container is-rounded is-dark" style={{ borderColor: "red" }}>
                                <p style={{ color: "red", fontWeight: "bold" }}>DANGER ZONE</p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <p style={{ margin: 0 }}>Reset the entire contest state.</p>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#aaa" }}>Zeroes all player scores, clears round progress, resets to Round 1.</p>
                                    </div>
                                    <button className="nes-btn is-error" onClick={handleFactoryReset}>
                                        FACTORY RESET
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* --- QUESTIONS VIEW --- */}
                    {activeTab === "questions" && (
                        <div>
                            <div style={{ marginBottom: "20px" }}>
                                <button className={`nes-btn ${questionTab === "r1" ? "is-primary" : ""}`} onClick={() => setQuestionTab("r1")} style={{ marginRight: "10px" }}>Logic (R1)</button>
                                <button className={`nes-btn ${questionTab === "r2" ? "is-warning" : ""}`} onClick={() => setQuestionTab("r2")} style={{ marginRight: "10px" }}>DSA (R2)</button>
                                <button className={`nes-btn ${questionTab === "r3" ? "is-success" : ""}`} onClick={() => setQuestionTab("r3")} style={{ marginRight: "10px" }}>Tech Quiz (R3)</button>
                                <button className={`nes-btn ${questionTab === "r4" ? "is-error" : ""}`} onClick={() => setQuestionTab("r4")}>Web Dev (R4)</button>
                            </div>

                            {/* ROUND 4 — FIGMA LINK */}
                            {questionTab === "r4" && (
                                <div className="nes-container is-dark with-title">
                                    <p className="title">Web Development — Figma Design Link</p>
                                    <p style={{ marginBottom: "15px", color: "#92cc41", fontSize: "0.85rem" }}>
                                        Players in Round 4 will see a button to open this Figma file. They code the design locally in VS Code.
                                    </p>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
                                        <input
                                            type="text"
                                            className="nes-input is-dark"
                                            style={{ flex: 1, minWidth: "300px" }}
                                            placeholder="https://www.figma.com/file/..."
                                            value={figmaLinkInput}
                                            onChange={e => setFigmaLinkInput(e.target.value)}
                                        />
                                        <button className="nes-btn is-success" onClick={handleSaveFigmaLink}>
                                            SAVE LINK
                                        </button>
                                    </div>
                                    {figmaLink && (
                                        <p style={{ marginTop: "10px", fontSize: "0.8rem" }}>
                                            ✅ Current: <a href={figmaLink} target="_blank" rel="noreferrer" style={{ color: "#209cee" }}>{figmaLink}</a>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ROUND 1 & 3 EDITOR */}
                            {(questionTab === "r1" || questionTab === "r3") && (
                                <div className="nes-container is-dark with-title">
                                    <p className="title">{questionTab === "r1" ? "Logical Reasoning" : "Tech Quiz"} Questions</p>

                                    {/* PERMISSION WARNING */}
                                    {permissionError && (
                                        <div className="nes-container is-rounded is-error" style={{ marginBottom: "20px", color: "red" }}>
                                            <p>⚠ PERMISSION ERROR: Firestore Rules are blocking writes.</p>
                                            <ul style={{ fontSize: "0.8rem", marginLeft: "20px" }}>
                                                <li>Go to Firebase Console &gt; Firestore &gt; Rules</li>
                                                <li>Set rules to: <code>allow read, write: if true;</code> (for testing)</li>
                                                <li>Or ensure you are authenticated if rules require it.</li>
                                            </ul>
                                        </div>
                                    )}

                                    {/* BULK UPLOAD */}
                                    <div className="nes-container is-rounded is-dark" style={{ marginBottom: "30px", borderColor: "#209cee" }}>
                                        <p style={{ color: "#209cee" }}>Bulk Upload (JSON)</p>
                                        <p style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
                                            Paste a JSON array of questions or upload a <code>.json</code> file.
                                            <br />Format: <code>[{`{ "text": "...", "options": ["..."], "answer": 0 }`}, ...]</code>
                                        </p>

                                        <textarea
                                            className="nes-textarea is-dark"
                                            value={bulkJson}
                                            onChange={e => setBulkJson(e.target.value)}
                                            placeholder={`[\n  {\n    "text": "Example Question?",\n    "options": ["A", "B", "C", "D"],\n    "answer": 0\n  }\n]`}
                                            style={{ height: "150px", marginBottom: "10px", fontSize: "0.8rem", fontFamily: "monospace" }}
                                        />

                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <label className="nes-btn is-primary">
                                                <span>Load File</span>
                                                <input type="file" accept=".json" onChange={e => handleFileUpload(e, questionTab)} style={{ display: "none" }} />
                                            </label>
                                            <button className="nes-btn is-success" onClick={() => handleBulkUpload(questionTab)}>PARSE & UPLOAD</button>
                                        </div>
                                    </div>

                                    {/* ADD FORM */}
                                    <div className="nes-container is-rounded is-dark" style={{ marginBottom: "30px", border: "2px dashed #555" }}>
                                        <p>Add New Question</p>
                                        <div className="nes-field" style={{ marginBottom: "10px" }}>
                                            <label>Question Text <span style={{ fontSize: "0.7rem", color: "#888" }}>(Optional if Image is used)</span></label>
                                            <input type="text" className="nes-input" value={newQText} onChange={e => setNewQText(e.target.value)} />
                                        </div>
                                        <div className="nes-field" style={{ marginBottom: "10px" }}>
                                            <label>Code Snippet (Optional)</label>
                                            <textarea className="nes-textarea" value={newQCode} onChange={e => setNewQCode(e.target.value)} style={{ height: "60px" }}></textarea>
                                        </div>
                                        <div className="nes-field" style={{ marginBottom: "10px" }}>
                                            <label style={{ color: "#92cc41" }}>
                                                🔗 Image URL <span style={{ fontSize: "0.7rem", color: "#888" }}>(Cloudinary / any public URL — recommended)</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="nes-input is-dark"
                                                placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                                                value={newQImageUrl}
                                                onChange={e => setNewQImageUrl(e.target.value)}
                                            />
                                            {newQImageUrl && (
                                                <img
                                                    src={newQImageUrl}
                                                    alt="Preview"
                                                    style={{ marginTop: "8px", maxHeight: "80px", border: "2px solid #92cc41", borderRadius: "4px" }}
                                                    onError={e => (e.currentTarget.style.display = "none")}
                                                    onLoad={e => (e.currentTarget.style.display = "block")}
                                                />
                                            )}
                                        </div>
                                        <div className="nes-field" style={{ marginBottom: "10px" }}>
                                            <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                                📁 Or Upload File to Firebase Storage <span style={{ color: "#555" }}>(only used if no URL above)</span>
                                            </label>
                                            {newQImage && <span className="is-success" style={{ marginLeft: "10px", fontSize: "0.8rem" }}>Selected: {newQImage.name}</span>}
                                            <input type="file" accept="image/*" onChange={e => setNewQImage(e.target.files?.[0] || null)} />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                            {newQOptions.map((opt, i) => (
                                                <div key={i}>
                                                    <input
                                                        type="text"
                                                        className="nes-input is-small"
                                                        placeholder={`Option ${i + 1}`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...newQOptions];
                                                            newOpts[i] = e.target.value;
                                                            setNewQOptions(newOpts);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ marginBottom: "15px" }}>
                                            <label>Correct Answer Index (0-3)</label>
                                            <select className="nes-select" value={newQAns} onChange={e => setNewQAns(parseInt(e.target.value))}>
                                                {newQOptions.map((_, i) => <option key={i} value={i}>Option {i + 1}</option>)}
                                            </select>
                                        </div>
                                        <button className={`nes-btn ${isUploading ? "is-disabled" : "is-success"}`} disabled={isUploading} onClick={() => handleAddQuestion(questionTab)}>
                                            {isUploading ? "UPLOADING..." : "ADD QUESTION"}
                                        </button>
                                    </div>

                                    {/* LIST */}
                                    <div className="nes-table-responsive">
                                        <table className="nes-table is-bordered is-dark" style={{ width: "100%" }}>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Question</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(questionTab === "r1" ? r1Questions : r3Questions).map((q, idx) => (
                                                    <tr key={idx}>
                                                        <td>{idx + 1}</td>
                                                        <td style={{ fontSize: "0.8rem" }}>
                                                            {q.image && (
                                                                <div style={{ marginBottom: "5px" }}>
                                                                    <img src={q.image} alt="Question" style={{ maxHeight: "50px", border: "1px solid #fff" }} />
                                                                </div>
                                                            )}
                                                            {q.text ? q.text.substring(0, 50) + (q.text.length > 50 ? "..." : "") : <em style={{ color: "#888" }}>[Image Only]</em>}
                                                        </td>
                                                        <td>
                                                            <button className="nes-btn is-error is-small" onClick={() => handleDeleteQuestion(questionTab, idx)}>DEL</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ROUND 2 EDITOR */}
                            {questionTab === "r2" && (
                                <div className="nes-container is-dark with-title">
                                    <p className="title">DSA Sprint Problems</p>
                                    <p style={{ marginBottom: "20px", fontSize: "0.8rem" }}>
                                        Configure the 2 problems for the User Dashbaord side. Users will see a "OPEN PROBLEM" button which links to the URL provided below.
                                    </p>

                                    {[0, 1].map((idx) => (
                                        <div key={idx} className="nes-container is-rounded is-dark" style={{ marginBottom: "20px" }}>
                                            <p style={{ color: "yellow" }}>Sprint {idx + 1}</p>
                                            <div className="nes-field" style={{ marginBottom: "10px" }}>
                                                <label>Problem Title</label>
                                                <input
                                                    type="text"
                                                    className="nes-input"
                                                    value={r2Problems[idx]?.title || ""}
                                                    onChange={e => {
                                                        const newP = [...r2Problems];
                                                        newP[idx] = { ...newP[idx], title: e.target.value };
                                                        setR2Problems(newP);
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "10px" }}>
                                                <div className="nes-field">
                                                    <label>Difficulty</label>
                                                    <input
                                                        type="text"
                                                        className="nes-input"
                                                        value={r2Problems[idx]?.difficulty || ""}
                                                        onChange={e => {
                                                            const newP = [...r2Problems];
                                                            newP[idx] = { ...newP[idx], difficulty: e.target.value };
                                                            setR2Problems(newP);
                                                        }}
                                                    />
                                                </div>
                                                <div className="nes-field">
                                                    <label>Problem Link</label>
                                                    <input
                                                        type="text"
                                                        className="nes-input"
                                                        placeholder="https://codeforces.com/..."
                                                        value={r2Problems[idx]?.link || ""}
                                                        onChange={e => {
                                                            const newP = [...r2Problems];
                                                            newP[idx] = { ...newP[idx], link: e.target.value };
                                                            setR2Problems(newP);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button className="nes-btn is-primary" onClick={handleSaveR2}>SAVE ROUND 2 CONFIG</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- SETTINGS / SETUP VIEW --- */}
                    {activeTab === "settings" && (
                        <div className="nes-container is-dark with-title">
                            <p className="title">Database Setup</p>

                            <div style={{ marginBottom: "30px" }}>
                                <p style={{ color: "#F7D51D", marginBottom: "10px" }}>Seed Allowed Users</p>
                                <p style={{ fontSize: "0.8rem", marginBottom: "20px" }}>
                                    This will create the <code>allowed_users</code> collection in Firestore with the default list of users.
                                    Required for the login system to work via database.
                                </p>
                                <button
                                    className="nes-btn is-primary"
                                    onClick={async () => {
                                        if (!confirm("This will overwrite existing permissions for these users. Continue?")) return;

                                        // Helper to generate password
                                        const generatePass = () => Math.random().toString(36).slice(-8);

                                        const usersToSeed = [
                                            { email: "user1@example.com", role: "user", pass: generatePass() },
                                            { email: "user2@example.com", role: "user", pass: generatePass() },
                                            { email: "advancedlooser70@gmail.com", role: "user", pass: generatePass() },
                                            { email: "parv@gmail.com", role: "user", pass: generatePass() },
                                            { email: "admin@example.com", role: "admin", pass: "admin123" },
                                            { email: "palak@example.com", role: "admin", pass: "admin123" },
                                            { email: "evaluator@example.com", role: "evaluator", pass: "eval123" }
                                        ];

                                        try {
                                            for (const u of usersToSeed) {
                                                await setDoc(doc(db, "allowed_users", u.email), {
                                                    role: u.role,
                                                    password: u.pass
                                                });
                                            }

                                            // Show passwords to Admin
                                            const passList = usersToSeed.map(u => `${u.email}: ${u.pass}`).join("\n");
                                            alert(`Successfully seeded! COPY THESE PASSWORDS:\n\n${passList}`);

                                        } catch (e: any) {
                                            alert("Error seeding DB: " + e.message);
                                        }
                                    }}
                                >
                                    SEED DATABASE WITH PASSWORDS
                                </button>
                            </div>

                            <div style={{ marginBottom: "30px" }}>
                                <p style={{ color: "#F7D51D", marginBottom: "10px" }}>Sync Questions (Hardcoded &rarr; DB)</p>
                                <p style={{ fontSize: "0.8rem", marginBottom: "20px" }}>
                                    This will upload the default questions from the code to Firestore.
                                    Useful if you want to edit them in the Firebase Console later.
                                </p>
                                <button
                                    className="nes-btn is-warning"
                                    onClick={async () => {
                                        if (!confirm("Overwrite existing questions in DB?")) return;

                                        try {
                                            // Seed Round 1
                                            await setDoc(doc(db, "contest_data", "round1"), {
                                                questions: ROUND1_QUESTIONS
                                            });

                                            // Seed Round 3
                                            await setDoc(doc(db, "contest_data", "round3"), {
                                                questions: ROUND3_QUESTIONS
                                            });

                                            alert("Questions synced to Firestore (contest_data/round1 & round3)!");

                                        } catch (e: any) {
                                            alert("Error syncing questions: " + e.message);
                                        }
                                    }}
                                >
                                    UPLOAD DEFAULT QUESTIONS
                                </button>
                            </div>

                            <div style={{ marginBottom: "30px" }}>
                                <p style={{ color: "#F7D51D", marginBottom: "10px" }}>Bulk Add Users</p>
                                <p style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
                                    Paste email addresses below (one per line).
                                    A downloadable CSV with passwords will be generated.
                                    <br />
                                    <strong style={{ color: "red" }}>NOTE:</strong> After adding here, you MUST create them in:
                                    <br />
                                    <a href="https://console.firebase.google.com/" target="_blank" style={{ color: "cyan", textDecoration: "underline" }}>
                                        Firebase Console &gt; Authentication
                                    </a>
                                </p>
                                <textarea
                                    className="nes-textarea is-dark"
                                    style={{ height: "150px", marginBottom: "10px" }}
                                    placeholder="user1@example.com&#10;user2@example.com&#10;..."
                                    value={bulkEmails}
                                    onChange={(e) => setBulkEmails(e.target.value)}
                                />
                                <button
                                    className="nes-btn is-success"
                                    onClick={handleBulkAdd}
                                >
                                    PROCESS & ADD USERS
                                </button>
                            </div>

                            <div className="nes-container is-rounded" style={{ borderColor: "#555", color: "#888" }}>
                                <p>Manual Add:</p>
                                <code style={{ display: "block", marginTop: "10px", fontSize: "0.7rem" }}>
                                    Collection: allowed_users<br />
                                    Document ID: email<br />
                                    Fields: role, password
                                </code>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
