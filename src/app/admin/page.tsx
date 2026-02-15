"use client";

import { useState, useEffect } from "react";
import { useContest } from "@/context/ContestContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";

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
    const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "game" | "settings">("dashboard");
    const [users, setUsers] = useState<UserData[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");

    const [lastUpdated, setLastUpdated] = useState<string>("");

    // --- Real-Time User Sync ---
    useEffect(() => {
        if (!isAuthenticated) return;

        const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const fetchedUsers: UserData[] = [];
            snapshot.forEach(doc => {
                fetchedUsers.push(doc.data() as UserData);
            });
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
                                            <th style={{ padding: "15px" }}>Progress</th>
                                            <th style={{ padding: "15px" }}>Warnings</th>
                                            <th style={{ padding: "15px" }}>Status</th>
                                            <th style={{ padding: "15px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td style={{ fontSize: "0.75rem", padding: "15px" }}>{user.id.substring(0, 8)}...</td>
                                                <td style={{ fontWeight: "bold", padding: "15px" }}>{user.name}</td>
                                                <td style={{ color: "#F7D51D", padding: "15px" }}>{user.team || "-"}</td>
                                                <td style={{ padding: "15px" }}>Round {user.round}</td>
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
