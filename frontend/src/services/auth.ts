import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    RecaptchaVerifier,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    signInWithPopup,
    signOut,
    updateProfile,
    type ConfirmationResult,
    type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { firebaseAuth } from "./firebase";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    avatar: string;
};

export type AuthErrorKind =
    | "cancelled"
    | "popup-blocked"
    | "network"
    | "configuration"
    | "credentials"
    | "email-in-use"
    | "weak-password"
    | "invalid-phone"
    | "invalid-code"
    | "unknown";

export class AuthFlowError extends Error {
    kind: AuthErrorKind;

    constructor(kind: AuthErrorKind, message: string) {
        super(message);
        this.name = "AuthFlowError";
        this.kind = kind;
    }
}

const mapFirebaseUser = (user: User): AuthUser => ({
    id: user.uid,
    name: user.displayName ?? "Thrifter shopper",
    email: user.email ?? "",
    avatar: user.photoURL ?? "",
});

export const subscribeToAuth = (callback: (user: AuthUser | null) => void) =>
    onAuthStateChanged(firebaseAuth, (user) => callback(user ? mapFirebaseUser(user) : null));

const translateAuthError = (error: unknown): AuthFlowError => {
    if (!(error instanceof FirebaseError)) {
        return new AuthFlowError("unknown", "Something went wrong. Please try again.");
    }

    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        return new AuthFlowError("cancelled", "Sign-in was cancelled.");
    }

    if (error.code === "auth/popup-blocked") {
        return new AuthFlowError(
            "popup-blocked",
            "Your browser blocked the Google sign-in window. Allow popups for this site and try again.",
        );
    }

    if (error.code === "auth/network-request-failed") {
        return new AuthFlowError("network", "Check your internet connection and try again.");
    }

    if (error.code === "auth/email-already-in-use") {
        return new AuthFlowError("email-in-use", "An account already exists for this email. Sign in instead.");
    }

    if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
    ) {
        return new AuthFlowError("credentials", "The email or password is incorrect.");
    }

    if (error.code === "auth/weak-password") {
        return new AuthFlowError("weak-password", "Use a stronger password with at least 6 characters.");
    }

    if (error.code === "auth/invalid-phone-number") {
        return new AuthFlowError("invalid-phone", "Enter a valid phone number.");
    }

    if (error.code === "auth/invalid-verification-code" || error.code === "auth/code-expired") {
        return new AuthFlowError("invalid-code", "The verification code is invalid or has expired.");
    }

    if (error.code === "auth/too-many-requests" || error.code === "auth/quota-exceeded") {
        return new AuthFlowError("unknown", "Too many attempts. Please try again later.");
    }

    if (error.code === "auth/unauthorized-domain" || error.code === "auth/operation-not-allowed") {
        return new AuthFlowError(
            "configuration",
            "This sign-in option is currently unavailable.",
        );
    }

    return new AuthFlowError("unknown", "Authentication could not be completed. Please try again.");
};

export const continueWithGoogle = async (): Promise<AuthUser> => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await signInWithPopup(firebaseAuth, provider);
        return mapFirebaseUser(result.user);
    } catch (error) {
        throw translateAuthError(error);
    }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
    try {
        const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return mapFirebaseUser(result.user);
    } catch (error) {
        throw translateAuthError(error);
    }
};

export const createEmailAccount = async (
    name: string,
    email: string,
    password: string,
): Promise<AuthUser> => {
    try {
        const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(result.user, { displayName: name });
        return mapFirebaseUser(result.user);
    } catch (error) {
        throw translateAuthError(error);
    }
};

export const sendResetEmail = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
        throw translateAuthError(error);
    }
};

let phoneConfirmation: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

const normalizePhoneNumber = (phoneNumber: string): string => {
    const trimmed = phoneNumber.trim();
    const digits = trimmed.replace(/\D/g, "");

    let normalized: string;

    if (trimmed.startsWith("+")) {
        normalized = `+${digits}`;
    } else if (digits.startsWith("00")) {
        normalized = `+${digits.slice(2)}`;
    } else if (digits.startsWith("254")) {
        normalized = `+${digits}`;
    } else if (digits.length === 10 && digits.startsWith("0")) {
        normalized = `+254${digits.slice(1)}`;
    } else if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
        normalized = `+254${digits}`;
    } else {
        normalized = `+${digits}`;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
        throw new AuthFlowError("invalid-phone", "Enter a valid phone number.");
    }

    return normalized;
};

export const sendPhoneCode = async (phoneNumber: string, containerId: string): Promise<void> => {
    try {
        recaptchaVerifier?.clear();
        recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
            size: "invisible",
        });
        phoneConfirmation = await signInWithPhoneNumber(
            firebaseAuth,
            normalizePhoneNumber(phoneNumber),
            recaptchaVerifier,
        );
    } catch (error) {
        recaptchaVerifier?.clear();
        recaptchaVerifier = null;
        throw translateAuthError(error);
    }
};

export const verifyPhoneCode = async (code: string, name?: string): Promise<AuthUser> => {
    if (!phoneConfirmation) {
        throw new AuthFlowError("invalid-code", "Request a new verification code.");
    }

    try {
        const result = await phoneConfirmation.confirm(code);

        if (name?.trim() && !result.user.displayName) {
            await updateProfile(result.user, { displayName: name.trim() });
        }

        phoneConfirmation = null;
        return mapFirebaseUser(result.user);
    } catch (error) {
        throw translateAuthError(error);
    }
};

export const signOutUser = () => signOut(firebaseAuth);
