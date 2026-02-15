"use client";

import { useState } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import Editor from "@monaco-editor/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { useContest } from "@/context/ContestContext";

export default function Round4Page() {
    const { currentTimeout } = useContest();
    const [code, setCode] = useState("<h1>Hello World</h1>\n<style>\n  body { background: #333; color: white; }\n</style>");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { unlockNextRound } = useContest();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const myEmail = localStorage.getItem("contest_user_email");
        if (myEmail) {
            try {
                const userRef = doc(db, "users", myEmail);
                await setDoc(userRef, {
                    submissions: { round4: code },
                    completedRoundIds: arrayUnion(4)
                }, { merge: true });

                alert("Project Submitted! Redirecting to Dashboard...");
                unlockNextRound();
                router.push("/dashboard");
            } catch (e) {
                console.error("Error submitting:", e);
                alert("Error submitting. Try again.");
                setIsSubmitting(false);
            }
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        setCode(value || "");
    };

    const [showAssets, setShowAssets] = useState(false);

    const assets = [
        { name: "Placeholder (150x150)", url: "https://via.placeholder.com/150" },
        { name: "Random Tech", url: "https://loremflickr.com/320/240/tech" },
        { name: "Code Rash Logo", url: "/logo.png" },
        { name: "Test Image", url: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&q=80" }, // Using a cool tech image as placeholder for the user's image
        { name: "User Avatar", url: "https://i.pravatar.cc/150?img=3" },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied URL to clipboard!");
    };

    return (
        <AntiCheatGuard allowCopyPaste={true}>
            <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
                {/* Header */}
                <div style={{ height: "60px", background: "#000", display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "4px solid #fff" }}>
                    <h2 style={{ color: "#fbd000", fontSize: "1rem" }}>Round 4: Web Development</h2>
                    <span style={{ color: "cyan", marginLeft: "20px" }}>
                        Time: {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                    </span>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                        <button className="nes-btn is-primary is-small" onClick={() => setShowAssets(!showAssets)}>
                            {showAssets ? "CLOSE ASSETS" : "OPEN ASSETS"}
                        </button>
                        <button
                            className={`nes-btn ${isSubmitting ? "is-disabled" : "is-success"} is-small`}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "SAVING..." : "SUBMIT"}
                        </button>
                    </div>
                </div>

                {/* Workspace */}
                <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

                    {/* Asset Library Panel */}
                    {showAssets && (
                        <div style={{
                            width: "250px", background: "#111", borderRight: "4px solid #fff",
                            padding: "10px", overflowY: "auto", color: "#fff", zIndex: 10
                        }}>
                            <h3 style={{ fontSize: "0.8rem", marginBottom: "1rem", color: "#00ff00" }}>Asset Library</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {assets.map((asset, idx) => (
                                    <div key={idx} className="nes-container is-rounded is-dark" style={{ padding: "10px" }}>
                                        <p style={{ fontSize: "0.7rem", marginBottom: "5px" }}>{asset.name}</p>

                                        {/* Thumbnail */}
                                        <div style={{ marginBottom: "5px", textAlign: "center", background: "#000", padding: "2px" }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={asset.url}
                                                alt={asset.name}
                                                style={{ maxWidth: "100%", maxHeight: "80px", objectFit: "contain" }}
                                            />
                                        </div>

                                        <div style={{ fontSize: "0.6rem", wordBreak: "break-all", color: "#888", marginBottom: "5px" }}>
                                            {asset.url}
                                        </div>
                                        <button
                                            className="nes-btn is-warning is-small"
                                            style={{ fontSize: "0.6rem", width: "100%" }}
                                            onClick={() => copyToClipboard(asset.url)}
                                        >
                                            COPY URL
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Editor */}
                    <div style={{ flex: 1, borderRight: "4px solid #fff" }}>
                        <Editor
                            height="100%"
                            defaultLanguage="html"
                            defaultValue={code}
                            theme="vs-dark"
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                            }}
                        />
                    </div>

                    {/* Preview */}
                    <div style={{ flex: 1, background: "#fff" }}>
                        <iframe
                            title="preview"
                            srcDoc={code}
                            style={{ width: "100%", height: "100%", border: "none" }}
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
