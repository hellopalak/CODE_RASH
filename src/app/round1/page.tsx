"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useContest } from "@/context/ContestContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

// Rapid Fire Logic & CS Fundamentals
const QUESTIONS = [
    { id: 1, text: "If 5 machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?", options: ["100 minutes", "5 minutes", "1 minute", "20 minutes"], answer: 1 },
    { id: 2, text: "Which number comes next: 2, 6, 12, 20, 30, ...?", options: ["40", "42", "38", "44"], answer: 1 },
    { id: 3, text: "Binary representation of the decimal number 10 is:", options: ["1001", "1100", "1010", "1000"], answer: 2 },
    { id: 4, text: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], answer: 1 },
    { id: 5, text: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Array", "Stack", "Tree"], answer: 2 },
    { id: 6, text: "Identify the odd one out: Linux, Windows, Python, macOS", options: ["Linux", "Windows", "Python", "macOS"], answer: 2 },
    { id: 7, text: "A byte consists of how many bits?", options: ["4", "8", "16", "32"], answer: 1 },
    { id: 8, text: "Which logic gate returns TRUE only if both inputs are TRUE?", options: ["OR", "NAND", "XOR", "AND"], answer: 3 },
    { id: 9, text: "What comes next in the sequence: A, C, F, J, O, ...?", options: ["T", "U", "S", "V"], answer: 1 },
    { id: 10, text: "In a race, you overtake the person in 2nd place. What position are you in?", options: ["1st", "2nd", "3rd", "Last"], answer: 1 },
    { id: 11, text: "Which protocol is used to send emails?", options: ["HTTP", "FTP", "SMTP", "POP3"], answer: 2 },
    { id: 12, text: "Which color is #00FF00?", options: ["Red", "Green", "Blue", "Yellow"], answer: 1 },
    { id: 13, text: "How many nodes are in a full binary tree with depth 3?", options: ["7", "8", "6", "15"], answer: 0 },
    { id: 14, text: "Which sort is generally fastest for large random datasets?", options: ["Bubble Sort", "Insertion Sort", "Selection Sort", "Quick Sort"], answer: 3 },
    { id: 15, text: "Git command to upload changes to remote?", options: ["git save", "git upload", "git push", "git commit"], answer: 2 },
    { id: 16, text: "What does SQL stand for?", options: ["Structured Question Language", "Structured Query Language", "Simple Query Logic", "Standard Query Link"], answer: 1 },
    { id: 17, text: "Hexadecimal 'F' equals decimal:", options: ["16", "15", "14", "10"], answer: 1 },
    { id: 18, text: "Which is NOT a programming language?", options: ["HTML", "Java", "C++", "Python"], answer: 0 },
    { id: 19, text: "Logical relation: IF A=B and B=C, then:", options: ["A > C", "A < C", "A = C", "A != C"], answer: 2 },
    { id: 20, text: "Debug this: INT x = 5 / 0;", options: ["Returns 0", "Returns Infinity", "Runtime Error", "Compiler Error"], answer: 2 },
];

export default function Round1Page() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const { currentTimeout, unlockNextRound, currentRoundId } = useContest();
    const router = useRouter();

    const handleNextQuestion = async (selectedOptionIndex: number | null) => {
        // Calculate points for this question
        const isCorrect = selectedOptionIndex === QUESTIONS[currentQuestion].answer;
        const newScore = score + (isCorrect ? 5 : 0);

        // Optimistically update state (though we might redirect before render)
        if (isCorrect) setScore(newScore);

        if (currentQuestion < QUESTIONS.length - 1) {
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

    const question = QUESTIONS[currentQuestion];

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
                        <span style={{ fontSize: "0.8rem", color: "cyan" }}>Q: {currentQuestion + 1}/{QUESTIONS.length}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: "20px", height: "10px", background: "#333", border: "2px solid #fff" }}>
                    <div style={{
                        width: `${((currentQuestion) / QUESTIONS.length) * 100}%`,
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
