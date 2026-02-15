"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useRouter } from "next/navigation";
import { useContest } from "@/context/ContestContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, getDoc } from "firebase/firestore";
import { ROUND3_QUESTIONS } from "@/lib/questions";

export default function Round3Page() {
    // State
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const router = useRouter();
    const { currentTimeout, unlockNextRound, currentRoundId } = useContest();

    // Fetch Questions from DB (optional override)
    useEffect(() => {
        const fetchQs = async () => {
            try {
                let loadedQuestions = ROUND3_QUESTIONS;
                const docSnap = await getDoc(doc(db, "contest_data", "round3"));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                        loadedQuestions = data.questions;
                    }
                }
                setQuestions(loadedQuestions);
            } catch (e) {
                console.error("Failed to load custom questions, using default.", e);
                setQuestions(ROUND3_QUESTIONS);
            }
        };
        fetchQs();
    }, []);

    const handleOptionSelect = (optionIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion]: optionIndex
        }));
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to submit your answers? This cannot be undone.")) return;

        // Calculate Score
        let finalScore = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.answer) {
                finalScore += 5; // +5 per correct answer
            }
        });

        // Save to Firestore
        const myEmail = localStorage.getItem("contest_user_email");
        if (myEmail) {
            try {
                const userRef = doc(db, "users", myEmail);
                await setDoc(userRef, {
                    scores: { round3: finalScore },
                    completedRoundIds: arrayUnion(3)
                }, { merge: true });
            } catch (e) {
                console.error("Error saving score:", e);
                alert("Error saving score! Please screenshot this: " + finalScore);
            }
        }

        alert(`Round 3 Complete! Score: ${finalScore}. Redirecting to Dashboard...`);
        unlockNextRound();
        router.push("/dashboard");
    };

    // Loading State
    if (questions.length === 0) return <div className="nes-container is-dark">Loading Questions...</div>;

    const question = questions[currentQuestion];

    if (currentRoundId !== 3) {
        return <div className="nes-container is-dark"><p>Round locked or passed.</p></div>;
    }

    return (
        <AntiCheatGuard allowCopyPaste={true}>
            {/* allowCopyPaste might be needed for specific asset Qs, but here it's just quiz. Keeping true as requested previously for R3. */}
            <div className="container" style={{ marginTop: "50px", maxWidth: "800px" }}>

                {/* Header Info */}
                <div className="nes-container is-dark is-rounded" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <span style={{ color: "#209cee" }}>ROUND 3</span>
                        <br />
                        <span style={{ fontSize: "0.8rem", color: "#888" }}>Tech Trivia & History</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <span style={{ display: "block", color: currentTimeout < 60 ? "red" : "#fff" }}>
                            ⏱ {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "cyan" }}>Q: {currentQuestion + 1}/{questions.length}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: "20px", height: "10px", background: "#333", border: "2px solid #fff" }}>
                    <div style={{
                        width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                        height: "100%",
                        background: "#209cee",
                        transition: "width 0.3s ease"
                    }} />
                </div>

                {/* Question Card */}
                <div className="nes-container with-title is-centered is-dark" style={{ minHeight: "300px" }}>
                    <p className="title">Question {currentQuestion + 1}</p>

                    <div style={{ marginBottom: "30px", fontSize: "1.2rem", lineHeight: "1.5" }}>
                        {question.text}
                        {question.code && (
                            <pre style={{ textAlign: "left", marginTop: "15px", padding: "10px", background: "#000", fontSize: "0.8rem" }}>
                                <code>{question.code}</code>
                            </pre>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {question.options.map((opt: string, idx: number) => {
                            const isSelected = answers[currentQuestion] === idx;
                            return (
                                <button
                                    key={idx}
                                    className={`nes-btn ${isSelected ? "is-primary" : ""}`}
                                    onClick={() => handleOptionSelect(idx)}
                                    style={{ minHeight: "60px" }}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                    <button
                        className="nes-btn"
                        disabled={currentQuestion === 0}
                        onClick={handlePrev}
                    >
                        &lt; PREV
                    </button>

                    {currentQuestion === questions.length - 1 ? (
                        <button className="nes-btn is-success" onClick={handleSubmit}>
                            SUBMIT ROUND &gt;
                        </button>
                    ) : (
                        <button className="nes-btn is-primary" onClick={handleNext}>
                            NEXT &gt;
                        </button>
                    )}
                </div>

                {/* Question Palette */}
                <div style={{ marginTop: "30px", display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            className={`nes-btn is-small ${currentQuestion === idx ? "is-primary" : answers[idx] !== undefined ? "is-success" : ""}`}
                            style={{ width: "30px", height: "30px", padding: "0", fontSize: "0.7rem" }}
                            onClick={() => setCurrentQuestion(idx)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Asset Tip from previous requests */}
                <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.7rem", color: "#666" }}>
                    <p>💡 Tip: Use your tech knowledge. No Google allowed!</p>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
