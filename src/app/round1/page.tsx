"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useContest } from "@/context/ContestContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, getDoc } from "firebase/firestore";
import { ROUND1_QUESTIONS } from "@/lib/questions";

export default function Round1Page() {
    // State
    const [questions, setQuestions] = useState(ROUND1_QUESTIONS);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const { currentTimeout, unlockNextRound, currentRoundId } = useContest();
    const router = useRouter();

    // Fetch Questions from DB (optional override)
    useEffect(() => {
        const fetchQs = async () => {
            try {
                const docSnap = await getDoc(doc(db, "contest_data", "round1"));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                        setQuestions(data.questions);
                    }
                }
            } catch (e) {
                console.error("Failed to load custom questions, using default.", e);
            }
        };
        fetchQs();
    }, []);

    const handleNextQuestion = async (selectedOptionIndex: number | null) => {
        // Calculate points for this question
        const isCorrect = selectedOptionIndex === questions[currentQuestion].answer;
        const newScore = score + (isCorrect ? 5 : 0);

        // Optimistically update state (though we might redirect before render)
        if (isCorrect) setScore(newScore);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            // Finished
            const finalScore = newScore;

            // Save to Firestore
            const myEmail = localStorage.getItem("contest_user_email");
            if (myEmail) {
                try {
                    const userRef = doc(db, "users", myEmail);
                    await setDoc(userRef, {
                        scores: { round1: finalScore },
                        // Mark as completed for this round to show "Waiting" on dashboard
                        completedRoundIds: arrayUnion(1) // Assuming we add this field logic
                    }, { merge: true });
                } catch (e) {
                    console.error("Error saving score:", e);
                    alert("Error saving score! Please screenshot this: " + finalScore);
                }
            }

            alert(`Round 1 Complete! Score: ${finalScore}/100. Redirecting to Dashboard...`);
            unlockNextRound(); // Updates local context
            router.push("/dashboard");
        }
    };

    const handleDisqualify = () => {
        // Handled by AntiCheatGuard internally mostly, but we can log
        console.log("Disqualified");
    };

    const question = questions[currentQuestion];

    // Auto-skip if time runs out is handled by ContestContext, but we can visually show urgency
    if (currentRoundId !== 1) {
        // If context says we moved on, the page should redirect (Context handles this, but safety check)
        return <div className="nes-container is-dark"><p>Round ends...</p></div>;
    }

    return (
        <AntiCheatGuard onDisqualify={handleDisqualify}>
            <div className="container" style={{ marginTop: "50px", maxWidth: "800px" }}>

                {/* Header Info */}
                <div className="nes-container is-dark is-rounded" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <span style={{ color: "#F7D51D" }}>ROUND 1</span>
                        <br />
                        <span style={{ fontSize: "0.8rem", color: "#888" }}>Logic & Fundamentals</span>
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
                        width: `${((currentQuestion) / questions.length) * 100}%`,
                        height: "100%",
                        background: "#00C853",
                        transition: "width 0.3s ease"
                    }} />
                </div>

                {/* Question Card */}
                <div className="nes-container with-title is-centered is-dark" style={{ minHeight: "300px" }}>
                    <p className="title">Question {currentQuestion + 1}</p>

                    <div style={{ marginBottom: "30px", fontSize: "1.2rem", lineHeight: "1.5" }}>
                        {question.text}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {question.options.map((opt, idx) => (
                            <button
                                key={idx}
                                className="nes-btn"
                                onClick={() => handleNextQuestion(idx)}
                                style={{ minHeight: "60px" }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer Hint */}
                <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.7rem", color: "#666" }}>
                    <p>⚠️ Anti-Cheat Active: Tab switching will result in disqualification.</p>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
