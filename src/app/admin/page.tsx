"use client";

import { useState, useEffect } from "react";
import { useContest } from "@/context/ContestContext";
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { ROUND1_QUESTIONS, ROUND3_QUESTIONS } from "@/lib/questions";

interface UserData {
    id: string;
    name: string;
    round: number;
    warnings: number;
    status: "Online" | "Offline" | "Disqualified" | "Kicked";
    score?: number;
    team?: string;
}

export default function AdminDashboard() {
    const { currentRoundId, currentTimeout, adminSetRound, adminSetTimer, adminResetContest } = useContest();
    const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "game" | "settings" | "questions">("dashboard");
    const [questionTab, setQuestionTab] = useState<"r1" | "r2" | "r3">("r1");
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
    const [newQCode, setNewQCode] = useState(""); // Optional code snippet
    const [newQImage, setNewQImage] = useState<File | null>(null); // Optional image
    const [isUploading, setIsUploading] = useState(false);
    const [bulkJson, setBulkJson] = useState("");

    // Permission Error Helper
    const [permissionError, setPermissionError] = useState(false);

    const fetchQuestions = async () => {
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
        if (activeTab === "questions") fetchQuestions();
    }, [activeTab]);

    const handleAddQuestion = async (round: "r1" | "r3") => {
        setIsUploading(true);
        let imageUrl = "";

        try {
            if (newQImage) {
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");

    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [bulkEmails, setBulkEmails] = useState("");

    // --- Bulk Upload Logic ---
    const handleBulkAdd = async () => {
        if (!bulkEmails.trim()) {
            alert("Please paste some emails first.");
            return;
        }

        const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
        if (emails.length === 0) return;

        if (!confirm(`Add ${emails.length} users? This will generate passwords for them.`)) return;

        const credentials: { email: string, pass: string }[] = [];

        try {
            for (const email of emails) {
                const pass = Math.random().toString(36).slice(-8);
                await setDoc(doc(db, "allowed_users", email), {
                    role: "user",
                    password: pass
                });
                credentials.push({ email, pass });
            }

            const csvContent = "data:text/csv;charset=utf-8,"
                + "Email,Password\n"
                + credentials.map(c => `${c.email},${c.pass}`).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "code_rash_credentials.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`Successfully added ${emails.length} users! Credentials downloaded.`);
            setBulkEmails("");

        } catch (e: any) {
            console.error(e);
            alert("Error adding users: " + e.message);
        }
    };

    // --- Real-Time User Sync ---
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

                fetchedUsers.push({
                    id: doc.id,
                    name: data.name || "Unknown",
                    round: data.round || 0,
                    warnings: data.warnings || 0,
                    status: data.status || "Offline",
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
                    <p className="title">Admin Login</p>
                    <div className="nes-field">
                        <input
                            type="password"
                            placeholder="Enter PIN"
                            className="nes-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (password === "admin123" ? setIsAuthenticated(true) : alert("Invalid PIN"))}
                        />
                    </div>
                    <button
                        className="nes-btn is-primary"
                        style={{ marginTop: "20px", width: "100%" }}
                        onClick={() => {
                            if (password === "admin123") setIsAuthenticated(true);
                            else alert("Invalid PIN");
                        }}
                    >
                        ACCESS CONTROL
                    </button>
                    <p style={{ marginTop: "15px", fontSize: "0.7rem", color: "#666" }}>Restricted Access. Event Organizers Only.</p>
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
        await updateDoc(doc(db, "users", id), { warnings: 0, status: "Online" });
    };



    // --- Layout ---
    return (
        <div style={{ display: "flex", height: "100vh", backgroundColor: "#212529", color: "#fff", fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif" }}>

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
                    <button className="nes-btn is-error" onClick={() => setIsAuthenticated(false)}>LOGOUT</button>
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
                                            <th style={{ padding: "15px" }}>ID</th>
                                            <th style={{ padding: "15px" }}>Player</th>
                                            <th style={{ padding: "15px" }}>Team</th>
                                            <th style={{ padding: "15px" }}>Score</th>
                                            <th style={{ padding: "15px" }}>Round</th>
                                            <th style={{ padding: "15px" }}>Warnings</th>
                                            <th style={{ padding: "15px" }}>Status</th>
                                            <th style={{ padding: "15px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td style={{ fontSize: "0.75rem", padding: "15px" }}>{(user.id || "").substring(0, 8)}...</td>
                                                <td style={{ fontWeight: "bold", padding: "15px" }}>{user.name}</td>
                                                <td style={{ color: "#F7D51D", padding: "15px" }}>{user.team || "-"}</td>
                                                <td style={{ color: "#00C853", padding: "15px", fontWeight: "bold" }}>{user.score || 0}</td>
                                                <td style={{ padding: "15px" }}>{user.round}</td>
                                                <td style={{ padding: "15px" }}>
                                                    {user.warnings || 0}/3
                                                </td>
                                                <td style={{ padding: "15px" }}>
                                                    {user.status === "Online" && <span className="nes-text is-success">Online</span>}
                                                    {user.status === "Disqualified" && <span className="nes-text is-error">DQ'd</span>}
                                                    {user.status === "Offline" && <span className="nes-text is-disabled">Offline</span>}
                                                    {user.status === "Kicked" && <span className="nes-text is-error">BANNED</span>}
                                                </td>
                                                <td style={{ padding: "15px" }}>
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <button
                                                            className="nes-btn is-error is-small"
                                                            disabled={user.status === "Kicked"}
                                                            onClick={() => handleKick(user.id)}
                                                            title="Ban User"
                                                        >
                                                            BAN
                                                        </button>
                                                        <button
                                                            className="nes-btn is-warning is-small"
                                                            disabled={!user.warnings || user.warnings === 0}
                                                            onClick={() => handleForgive(user.id)}
                                                            title="Reset Warnings"
                                                        >
                                                            RST
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: "center" }}>Waiting for players...</td>
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
                                    <p>Reset the entire contest state. All progress will be lost.</p>
                                    <button className="nes-btn is-error" onClick={() => { if (confirm("ARE YOU SURE? THIS CANNOT BE UNDONE.")) adminResetContest(); }}>
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
                                <button className={`nes-btn ${questionTab === "r3" ? "is-success" : ""}`} onClick={() => setQuestionTab("r3")}>Tech Quiz (R3)</button>
                            </div>

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
                                            <label>Question Text</label>
                                            <input type="text" className="nes-input" value={newQText} onChange={e => setNewQText(e.target.value)} />
                                        </div>
                                        <div className="nes-field" style={{ marginBottom: "10px" }}>
                                            <label>Code Snippet (Optional)</label>
                                            <textarea className="nes-textarea" value={newQCode} onChange={e => setNewQCode(e.target.value)} style={{ height: "60px" }}></textarea>
                                        </div>
                                        <div className="nes-field" style={{ marginBottom: "10px" }}>
                                            <label>Image (Optional) {newQImage && <span className="is-success">- Selected: {newQImage.name}</span>}</label>
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
                                                        <td style={{ fontSize: "0.8rem" }}>{q.text.substring(0, 50)}...</td>
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
