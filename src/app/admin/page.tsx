"use client";

import { useState } from "react";

export default function AdminDashboard() {
    // Mock State for Questions
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQ, setNewQ] = useState({ text: "", options: ["", "", "", ""], answer: 0 });

    // Mock State for Codeforces
    const [cfTag, setCfTag] = useState("implementation");
    const [fetchedProblems, setFetchedProblems] = useState<any[]>([]);

    // Qualification Limits
    const [cutoffRank, setCutoffRank] = useState(10);
    const [cutoffScore, setCutoffScore] = useState(80);

    const handleAddQuestion = () => {
        setQuestions([...questions, { ...newQ, id: Date.now() }]);
        setNewQ({ text: "", options: ["", "", "", ""], answer: 0 });
        alert("Question Added to Database!");
    };

    const fetchCodeforces = async () => {
        try {
            const res = await fetch(`https://codeforces.com/api/problemset.problems?tags=${cfTag}`);
            const data = await res.json();
            if (data.status === "OK") {
                setFetchedProblems(data.result.problems.slice(0, 5)); // Take top 5
            } else {
                alert("Failed to fetch from Codeforces");
            }
        } catch (e) {
            console.error(e);
            alert("Error fetching (CORS or Network)");
        }
    };

    return (
        <div className="container">
            <div className="nes-container with-title is-dark">
                <p className="title">Admin Control Panel</p>
                <p>Manage the game state here.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                {/* Quiz Management */}
                <div className="nes-container is-rounded">
                    <h3>Quiz Management</h3>
                    <div className="nes-field">
                        <label>Question Text</label>
                        <input
                            type="text"
                            className="nes-input"
                            value={newQ.text}
                            onChange={e => setNewQ({ ...newQ, text: e.target.value })}
                        />
                    </div>
                    {/* Options would go here */}
                    <button className="nes-btn is-primary" onClick={handleAddQuestion} style={{ marginTop: "10px" }}>
                        Add Question
                    </button>
                    <p>Total Questions: {questions.length}</p>
                </div>

                {/* Codeforces Fetcher */}
                <div className="nes-container is-rounded">
                    <h3>Codeforces Fetcher</h3>
                    <div className="nes-field">
                        <label>Tag (e.g. dp, graphs)</label>
                        <input
                            type="text"
                            className="nes-input"
                            value={cfTag}
                            onChange={e => setCfTag(e.target.value)}
                        />
                    </div>
                    <button className="nes-btn is-warning" onClick={fetchCodeforces} style={{ marginTop: "10px" }}>
                        Fetch Problems
                    </button>
                    {fetchedProblems.length > 0 && (
                        <ul className="nes-list is-disc" style={{ marginTop: "10px", fontSize: "0.8rem" }}>
                            {fetchedProblems.map(p => (
                                <li key={p.contestId + p.index}>{p.name} ({p.rating})</li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Qualification Settings */}
                <div className="nes-container is-rounded">
                    <h3>Qualification Settings</h3>
                    <div className="nes-field">
                        <label>Cut-off Rank: <span style={{ color: "cyan" }}>{cutoffRank}</span></label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={cutoffRank}
                            onChange={e => setCutoffRank(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div className="nes-field">
                        <label>Min Score: <span style={{ color: "cyan" }}>{cutoffScore}%</span></label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={cutoffScore}
                            onChange={e => setCutoffScore(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <button className="nes-btn is-error" style={{ marginTop: "10px" }}>Apply Logic</button>
                </div>
            </div>
        </div>
    );
}
