import { useEffect, useState, type FormEvent } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    Mail,
    Phone,
    UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { AuthFlowError } from "../services/auth";

type AuthMode = "signin" | "signup" | "reset";
type AuthMethod = "email" | "phone";

const fieldClasses =
    "w-full rounded-xl border border-brand-rose/30 bg-white py-3 pl-11 pr-4 text-sm text-pine outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/15";

const GoogleIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-1.99 3.02v2.54h3.23c1.89-1.74 2.98-4.3 2.98-7.4Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.54a6 6 0 0 1-8.93-3.16H3.12v2.62A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.46 13.88A6 6 0 0 1 6.15 12c0-.65.11-1.29.31-1.88V7.5H3.12A10 10 0 0 0 2 12c0 1.61.39 3.13 1.12 4.5l3.34-2.62Z" />
        <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.88 5.5l3.34 2.62A6 6 0 0 1 12 5.95Z" />
    </svg>
);

const LoginPage = () => {
    const [mode, setMode] = useState<AuthMode>("signin");
    const [method, setMethod] = useState<AuthMethod>("email");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [phoneCodeSent, setPhoneCodeSent] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pendingAction, setPendingAction] = useState<"form" | "google" | null>(null);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const {
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        createAccount,
        resetPassword,
        sendPhoneCode,
        verifyPhoneCode,
    } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo =
        typeof location.state === "object" &&
        location.state !== null &&
        "returnTo" in location.state &&
        typeof location.state.returnTo === "string" &&
        location.state.returnTo.startsWith("/") &&
        location.state.returnTo !== "/login"
            ? location.state.returnTo
            : "/";

    useEffect(() => {
        if (!loading && user) {
            navigate(returnTo, { replace: true });
        }
    }, [loading, navigate, returnTo, user]);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                navigate(returnTo);
            }
        };

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [navigate, returnTo]);

    const showAuthError = (error: unknown) => {
        setMessage({
            type: "error",
            text: error instanceof AuthFlowError ? error.message : "Something went wrong. Please try again.",
        });
    };

    const changeMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setMessage(null);
        setPassword("");
        setConfirmPassword("");
        setVerificationCode("");
        setPhoneCodeSent(false);

        if (nextMode === "reset") {
            setMethod("email");
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);

        if (mode !== "reset" && method === "phone") {
            setPendingAction("form");

            try {
                if (phoneCodeSent) {
                    await verifyPhoneCode(verificationCode, mode === "signup" ? name : undefined);
                    navigate(returnTo, { replace: true });
                } else {
                    await sendPhoneCode(phone.trim(), "phone-recaptcha");
                    setPhoneCodeSent(true);
                    setMessage({ type: "success", text: "Verification code sent." });
                }
            } catch (error) {
                showAuthError(error);
            } finally {
                setPendingAction(null);
            }

            return;
        }

        if (mode === "signup" && password !== confirmPassword) {
            setMessage({ type: "error", text: "Your passwords do not match." });
            return;
        }

        setPendingAction("form");

        try {
            if (mode === "reset") {
                await resetPassword(email);
                setMessage({
                    type: "success",
                    text: "Check your inbox for a password reset link.",
                });
                return;
            }

            if (mode === "signup") {
                await createAccount(name.trim(), email.trim(), password);
            } else {
                await signInWithEmail(email.trim(), password);
            }

            navigate(returnTo, { replace: true });
        } catch (error) {
            showAuthError(error);
        } finally {
            setPendingAction(null);
        }
    };

    const handleGoogleAuth = async () => {
        setMessage(null);
        setPendingAction("google");

        try {
            await signInWithGoogle();
            navigate(returnTo, { replace: true });
        } catch (error) {
            showAuthError(error);
        } finally {
            setPendingAction(null);
        }
    };

    const heading =
        mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back";

    return (
        <main
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-heading"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    navigate(returnTo);
                }
            }}
            className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-pine/60 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
        >
            <div className="mx-auto grid w-full max-w-lg overflow-hidden rounded-3xl border border-brand-rose/25 bg-white shadow-2xl shadow-wine/20 lg:max-w-5xl lg:grid-cols-[0.9fr_1.1fr]">
                <aside aria-label="Future campaign image" className="relative hidden min-h-full overflow-hidden bg-pine lg:block">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-rose/25" />
                    <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-wine/60" />
                    <div className="absolute inset-10 rounded-[2rem] border border-white/15 bg-white/5" />
                    <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-pink/20 ring-1 ring-white/20" />
                </aside>

                <section className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                    <Link
                        to={returnTo}
                        className="mb-6 inline-flex w-fit items-center gap-2 rounded-md text-sm font-semibold text-pine hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                    >
                        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                        Back to shop
                    </Link>

                    <h2 id="auth-heading" className="text-3xl font-bold text-pine">{heading}</h2>

                    {mode !== "reset" && (
                        <>
                            <button
                                type="button"
                                onClick={() => void handleGoogleAuth()}
                                disabled={pendingAction !== null || loading}
                                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-brand-rose/35 bg-white px-5 py-3 text-sm font-bold text-pine transition hover:border-pine hover:bg-brand-pink/25 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
                            >
                                {pendingAction === "google" ? (
                                    <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                                ) : (
                                    <GoogleIcon />
                                )}
                                Continue with Google
                            </button>
                            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-pine/40">
                                <span className="h-px flex-1 bg-brand-rose/25" />
                                email or phone number
                                <span className="h-px flex-1 bg-brand-rose/25" />
                            </div>

                            <div className="mb-5 grid grid-cols-2 rounded-full bg-brand-pink/35 p-1">
                                {(["email", "phone"] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => {
                                            setMethod(option);
                                            setMessage(null);
                                            setPhoneCodeSent(false);
                                            setVerificationCode("");
                                        }}
                                        className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                                            method === option
                                                ? "bg-pine text-white shadow-sm"
                                                : "text-pine/65 hover:text-pine"
                                        }`}
                                    >
                                        {option === "email" ? "Email" : "Phone"}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className={mode === "reset" ? "mt-7 space-y-4" : "space-y-4"}>
                        {mode === "signup" && (
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-pine">Full name</span>
                                <span className="relative block">
                                    <UserRound aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-rose" />
                                    <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={fieldClasses} placeholder="Your name" />
                                </span>
                            </label>
                        )}

                        {(method === "email" || mode === "reset") ? (
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-pine">Email address</span>
                                <span className="relative block">
                                    <Mail aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-rose" />
                                    <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={fieldClasses} placeholder="you@example.com" />
                                </span>
                            </label>
                        ) : (
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-pine">
                                    {phoneCodeSent ? "Verification code" : "Phone number"}
                                </span>
                                <span className="relative block">
                                    <Phone aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-rose" />
                                    <input
                                        required
                                        type="tel"
                                        value={phoneCodeSent ? verificationCode : phone}
                                        onChange={(event) =>
                                            phoneCodeSent
                                                ? setVerificationCode(event.target.value)
                                                : setPhone(event.target.value)
                                        }
                                        autoComplete={phoneCodeSent ? "one-time-code" : "tel"}
                                        inputMode={phoneCodeSent ? "numeric" : "tel"}
                                        className={fieldClasses}
                                        placeholder={phoneCodeSent ? "Enter SMS code" : "0712 345 678"}
                                    />
                                </span>
                            </label>
                        )}

                        {mode !== "reset" && method === "email" && (
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-pine">Password</span>
                                <span className="relative block">
                                    <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-rose" />
                                    <input required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={`${fieldClasses} pr-11`} placeholder="At least 6 characters" />
                                    <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-pine/55 hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine">
                                        {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                                    </button>
                                </span>
                            </label>
                        )}

                        {mode === "signup" && method === "email" && (
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-pine">Confirm password</span>
                                <span className="relative block">
                                    <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-rose" />
                                    <input required minLength={6} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className={fieldClasses} placeholder="Repeat your password" />
                                </span>
                            </label>
                        )}

                        {mode === "signin" && method === "email" && (
                            <button type="button" onClick={() => changeMode("reset")} className="block text-sm font-bold text-wine underline decoration-brand-rose underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine">
                                Forgot password?
                            </button>
                        )}

                        {message && (
                            <div role={message.type === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl p-3 text-sm ${message.type === "error" ? "bg-wine/5 text-wine" : "bg-pine/5 text-pine"}`}>
                                {message.type === "error" ? <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}
                                {message.text}
                            </div>
                        )}

                        <button type="submit" disabled={pendingAction !== null || loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-pine px-5 py-3 text-sm font-bold text-white transition hover:bg-wine disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2">
                            {pendingAction === "form" && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                            {mode === "reset"
                                ? "Send reset link"
                                : method === "phone"
                                  ? phoneCodeSent
                                      ? "Verify and continue"
                                      : "Send verification code"
                                  : mode === "signup"
                                    ? "Create account"
                                    : "Sign in"}
                        </button>
                    </form>
                    <div id="phone-recaptcha" />

                    <p className="mt-6 text-center text-sm text-pine/65">
                        {mode === "signin" && <>New to Thrifter? <button type="button" onClick={() => changeMode("signup")} className="font-bold text-wine underline underline-offset-4">Create an account</button></>}
                        {mode === "signup" && <>Already have an account? <button type="button" onClick={() => changeMode("signin")} className="font-bold text-wine underline underline-offset-4">Sign in</button></>}
                        {mode === "reset" && <button type="button" onClick={() => changeMode("signin")} className="font-bold text-wine underline underline-offset-4">Return to sign in</button>}
                    </p>
                </section>
            </div>
        </main>
    );
};

export default LoginPage;
