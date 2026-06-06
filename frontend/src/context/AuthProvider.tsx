import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AuthContext } from "./auth-context";
import {
    createEmailAccount,
    continueWithGoogle,
    sendPhoneCode,
    sendResetEmail,
    signInWithEmail,
    signOutUser,
    subscribeToAuth,
    verifyPhoneCode,
    type AuthUser,
} from "../services/auth";

const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(
        () =>
            subscribeToAuth((nextUser) => {
                setUser(nextUser);
                setLoading(false);
            }),
        [],
    );

    const value = useMemo(
        () => ({
            user,
            loading,
            signInWithGoogle: continueWithGoogle,
            signInWithEmail,
            createAccount: createEmailAccount,
            resetPassword: sendResetEmail,
            sendPhoneCode,
            verifyPhoneCode,
            signOut: signOutUser,
        }),
        [user, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
