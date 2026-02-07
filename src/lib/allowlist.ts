// This file simulates the database of allowed users for the contest.
// In a real scenario, this might fetch from Firestore or a GSheet.

export const ALLOWED_USERS = [
    "user1@example.com",
    "user2@example.com",
    "advancedlooser70@gmail.com",
];

export const ALLOWED_EVALUATORS = [
    "evaluator@example.com",
];

export const ALLOWED_ADMINS = [
    "admin@example.com",
];

export const checkAccess = (email: string, role: string): boolean => {
    if (role === 'admin') return ALLOWED_ADMINS.includes(email);
    if (role === 'evaluator') return ALLOWED_EVALUATORS.includes(email);
    if (role === 'user') return ALLOWED_USERS.includes(email);
    return false;
};
