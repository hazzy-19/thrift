import { LogOut, UserRound } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

const AccountPage = () => {
    const { user, loading, signOut } = useAuth();

    if (loading) {
        return <main className="mx-auto max-w-4xl px-4 py-12 text-pine">Loading account...</main>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <section className="rounded-2xl border border-brand-rose/25 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt=""
                            className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-pink"
                        />
                    ) : (
                        <UserRound aria-hidden="true" className="h-16 w-16 rounded-full bg-brand-pink p-3 text-pine" />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-pine">{user.name}</h1>
                        <p className="mt-1 text-sm text-pine/65">{user.email}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
                >
                    <LogOut aria-hidden="true" className="h-4 w-4" />
                    Sign out
                </button>
            </section>
        </main>
    );
};

export default AccountPage;
