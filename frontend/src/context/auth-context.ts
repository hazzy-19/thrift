import { createContext, useContext } from "react";
import type { AuthUser } from "../services/auth";

export type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<AuthUser>;
    signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
    createAccount: (name: string, email: string, password: string) => Promise<AuthUser>;
    resetPassword: (email: string) => Promise<void>;
    sendPhoneCode: (phoneNumber: string, containerId: string) => Promise<void>;
    verifyPhoneCode: (code: string, name?: string) => Promise<AuthUser>;
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider.");
    }

    return context;
};
