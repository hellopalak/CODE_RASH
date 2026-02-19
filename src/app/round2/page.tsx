"use client";

import { useState, useEffect } from "react";
import { useContest } from "@/context/ContestContext";

import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, onSnapshot } from "firebase/firestore";

export default function Round2Page() {
    const { currentTimeout, unlockNextRound } = useContest();
    const router = useRouter();

    // Redirect when Timeout = 0
    useEffect(() => {
        if (currentTimeout <= 0) {
            alert("Time's up! Redirecting to dashboard...");
            router.push("/dashboard");
        }
    }, [currentTimeout, router]);

    const [problems, setProblems] = useState<any[]>([
        { id: "1", title: "Watermelon", difficulty: "800", link: "https://codeforces.com/problemset/problem/4/A" },
        { id: "2", title: "Way Too Long Words", difficulty: "800", link: "https://codeforces.com/problemset/problem/71/A" }
    ]);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "contest_data", "round2"), (docSnap) => {
            if (docSnap.exists() && docSnap.data().problems) {
                setProblems(docSnap.data().problems);
            }
        });
        return () => unsub();
    }, []);

    // Sprint Logic: Total 30m (1800s). First 15m (1800-900) = Prob 1. Last 15m (900-0) = Prob 2.
    const isSprint1 = currentTimeout > 900;
    const currentProblem = isSprint1 ? problems[0] : problems[1];

    // Calculate sprint time remaining
    const sprintTime = isSprint1 ? currentTimeout - 900 : currentTimeout;

    const [submissionLink, setSubmissionLink] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    // router declared above

    const handleSubmit = async () => {
        if (!submissionLink.includes("codeforces.com")) {
            alert("Please provide a valid Codeforces link.");
            return;
        }

        setIsSubmitting(true);
        const myEmail = localStorage.getItem("contest_user_email");
        if (myEmail) {
            try {
                const userRef = doc(db, "users", myEmail);
                await setDoc(userRef, {
                    submissions: { round2: submissionLink },
                    completedRoundIds: arrayUnion(2)
                }, { merge: true });

                alert("Submission Received! Redirecting to Dashboard...");
                unlockNextRound();
                router.push("/dashboard");
            } catch (e) {
                console.error("Error submitting:", e);
                alert("Error submitting. Try again.");
                setIsSubmitting(false);
            }
        }
    };

    return (
        <>
            <div className="container" style={{ marginTop: "50px" }}>
                <div className="nes-container is-rounded is-dark">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2>Round 2: DSA Sprints</h2>
                        <div style={{ textAlign: "right" }}>
                            <span style={{ color: "cyan", display: "block" }}>
                                Total Time: {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                            </span>
                            <span style={{ color: "yellow", fontSize: "0.8rem" }}>
                                Sprint {isSprint1 ? "1" : "2"} Ends In: {Math.floor(sprintTime / 60)}:{(sprintTime % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    <p style={{ marginBottom: "20px" }}>
                        Solve the current sprint problem on Codeforces.
                        <br />
                        WARNING: Sprint {isSprint1 ? "1" : "2"} is active.
                    </p>

                    <div className="nes-table-responsive">
                        <table className="nes-table is-bordered is-centered is-dark" style={{ width: "100%" }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Problem Name</th>
                                    <th>Difficulty</th>
                                    <th>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{isSprint1 ? "1" : "2"}</td>
                                    <td>{currentProblem.title}</td>
                                    <td>{currentProblem.difficulty}</td>
                                    <td>
                                        <a href={currentProblem.link} target="_blank" rel="noopener noreferrer">
                                            <button className="nes-btn is-primary">OPEN PROBLEM</button>
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* SUBMISSION AREA */}
                    <div className="nes-container is-dark with-title" style={{ marginTop: "30px" }}>
                        <p className="title">Submission</p>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                                type="text"
                                className="nes-input is-dark"
                                placeholder="Paste Codeforces Submission URL..."
                                value={submissionLink}
                                onChange={(e) => setSubmissionLink(e.target.value)}
                            />
                            <button
                                className={`nes-btn ${isSubmitting ? "is-disabled" : "is-success"}`}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "WAIT..." : "FINISH ROUND"}
                            </button>
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "#888", marginTop: "10px" }}>
                            Paste the link to your accepted submission. Once you submit, you will be redirected to the dashboard.
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}
