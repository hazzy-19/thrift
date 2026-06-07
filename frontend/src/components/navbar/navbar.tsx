import { useEffect, useRef, useState, type FormEvent } from "react";
import {
    ChevronDown,
    Heart,
    Menu,
    Search,
    ShoppingBag,
    UserRound,
    X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { getAnnouncements, type Announcement } from "../../services/announcements";
import AnnouncementTicker from "./AnnouncementTicker";

type User = {
    name: string;
    avatar: string;
};

type NavbarProps = {
    cartCount: number;
    user: User | null;
};

const navItems = [
    { label: "Shop", to: "/" },
    { label: "Men", to: "/men" },
    { label: "Women", to: "/women" },
    { label: "Kids", to: "/kids" },
];

const focusClasses =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2";

const Navbar = ({ cartCount, user }: NavbarProps) => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [atTop, setAtTop] = useState(true);
    const [secondaryHidden, setSecondaryHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementIndex, setAnnouncementIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const lastScrollY = useRef(0);

    const displayedCartCount = cartCount > 99 ? "99+" : cartCount;

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isScrolled = currentScrollY > 10;

            setScrolled(isScrolled);
            setAtTop(currentScrollY === 0);
            setSecondaryHidden(isScrolled && currentScrollY > lastScrollY.current);

            if (currentScrollY > 0) {
                setShowSearch(false);
                setMenuOpen(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (showSearch) {
            searchInputRef.current?.focus();
        }
    }, [showSearch]);

    useEffect(() => {
        const controller = new AbortController();

        const loadAnnouncements = async () => {
            try {
                const nextAnnouncements = await getAnnouncements(controller.signal);
                setAnnouncements(nextAnnouncements);
                setAnnouncementIndex((current) =>
                    nextAnnouncements.length ? current % nextAnnouncements.length : 0,
                );
            } catch {
                if (!controller.signal.aborted) {
                    setAnnouncements([]);
                    setAnnouncementIndex(0);
                }
            }
        };

        void loadAnnouncements();
        const intervalId = window.setInterval(() => void loadAnnouncements(), 30_000);

        return () => {
            controller.abort();
            window.clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (announcements.length < 2) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setAnnouncementIndex((current) => (current + 1) % announcements.length);
        }, 5_000);

        return () => window.clearInterval(intervalId);
    }, [announcements.length]);

    const currentAnnouncement = announcements[announcementIndex];

    useEffect(() => {
        const closeSearchOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowSearch(false);
            }
        };

        document.addEventListener("keydown", closeSearchOnEscape);
        return () => document.removeEventListener("keydown", closeSearchOnEscape);
    }, []);

    const closeMobilePanels = () => {
        setMenuOpen(false);
        setShowSearch(false);
    };

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    const searchForm = (mobile = false) => (
        <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="relative w-full"
        >
            <label htmlFor={mobile ? "mobile-search" : "desktop-search"} className="sr-only">
                Search products
            </label>
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500"
            />
            <input
                ref={mobile ? searchInputRef : undefined}
                id={mobile ? "mobile-search" : "desktop-search"}
                type="search"
                placeholder="Search products..."
                className={`w-full rounded-full border border-rose-200 bg-white py-2 pl-10 text-sm text-rose-950 placeholder:text-rose-400 transition-colors hover:border-rose-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 ${
                    mobile ? "pr-10" : "pr-4"
                }`}
            />
            {mobile && (
                <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setShowSearch(false)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-rose-600 hover:bg-rose-100 ${focusClasses}`}
                >
                    <X aria-hidden="true" className="h-4 w-4" />
                </button>
            )}
        </form>
    );

    const cartLink = (
        <Link
            to="/cart"
            onClick={closeMobilePanels}
            aria-label={`Shopping cart with ${Math.max(0, cartCount)} ${cartCount === 1 ? "item" : "items"}`}
            className={`relative rounded-full p-2 text-rose-800 transition-colors hover:bg-rose-100 hover:text-rose-950 ${focusClasses}`}
        >
            <ShoppingBag aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6" />
            {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-800 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-rose-50">
                    {displayedCartCount}
                </span>
            )}
        </Link>
    );

    return (
        <header
            className={`sticky top-0 z-50 border-b border-rose-100 bg-rose-50/95 backdrop-blur transition-shadow ${
                scrolled ? "shadow-md" : "shadow-sm"
            }`}
        >
            <div className="mx-auto hidden max-w-7xl items-center gap-6 px-6 py-3 md:flex lg:px-8">
                <Link
                    to="/"
                    aria-label="Thrifter home"
                    className={`flex shrink-0 items-center gap-2 rounded-md ${focusClasses}`}
                >
                    <img src={logo} alt="" className="h-10 w-10 object-contain" />
                    <span className="hidden font-display text-xl font-bold uppercase tracking-wider text-pine lg:inline">
                        Thrifter
                    </span>
                </Link>

                <div className="mx-auto min-w-0 max-w-2xl flex-1">{searchForm()}</div>

                <div className="flex shrink-0 items-center gap-1">
                    {user ? (
                        <Link
                            to="/account"
                            aria-label={`${user.name}'s account`}
                            className={`flex items-center gap-2 rounded-full p-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100 ${focusClasses}`}
                        >
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt=""
                                    className="h-7 w-7 rounded-full bg-brand-pink object-cover ring-1 ring-brand-rose/40"
                                />
                            ) : (
                                <UserRound
                                    aria-hidden="true"
                                    className="h-7 w-7 rounded-full bg-brand-pink p-1 text-pine"
                                />
                            )}
                            <span className="hidden max-w-24 truncate lg:block">{user.name}</span>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            state={{ returnTo: location.pathname }}
                            className={`flex items-center gap-1.5 rounded-full bg-pine px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-wine ${focusClasses}`}
                        >
                            <UserRound aria-hidden="true" className="h-5 w-5" />
                            <span>Sign in</span>
                        </Link>
                    )}
                    <Link
                        to="/wishlist"
                        aria-label="Wishlist"
                        className={`rounded-full p-2 text-rose-800 transition-colors hover:bg-rose-100 hover:text-rose-950 ${focusClasses}`}
                    >
                        <Heart aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6" />
                    </Link>
                    {cartLink}
                </div>
            </div>

            <div
                className={`hidden overflow-hidden border-t border-rose-100 transition-[max-height,opacity,transform] duration-300 ease-out md:block ${
                    secondaryHidden
                        ? "max-h-0 -translate-y-2 opacity-0"
                        : "max-h-14 translate-y-0 opacity-100"
                }`}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 lg:px-8">
                    <nav aria-label="Product categories">
                        <ul className="flex items-center gap-5 lg:gap-8">
                            {navItems.map(({ label, to }) => (
                                <li key={to}>
                                    <NavLink
                                        to={to}
                                        end={to === "/"}
                                        className={({ isActive }) =>
                                            `flex items-center gap-1 border-b-2 py-3 text-sm transition-colors ${focusClasses} ${
                                                isActive
                                                    ? "border-rose-700 font-semibold text-rose-950"
                                                    : "border-transparent font-medium text-rose-700 hover:border-rose-300 hover:text-rose-950"
                                            }`
                                        }
                                    >
                                        {label}
                                        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    {currentAnnouncement && (
                        <AnnouncementTicker
                            announcement={currentAnnouncement}
                            position={announcementIndex}
                            total={announcements.length}
                        />
                    )}
                </div>
            </div>

            <div className="md:hidden">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2">
                    <button
                        type="button"
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={menuOpen}
                        onClick={() => {
                            setMenuOpen((open) => !open);
                            setShowSearch(false);
                        }}
                        className={`w-fit rounded-full p-2 text-rose-800 hover:bg-rose-100 ${focusClasses}`}
                    >
                        {menuOpen ? (
                            <X aria-hidden="true" className="h-6 w-6" />
                        ) : (
                            <Menu aria-hidden="true" className="h-6 w-6" />
                        )}
                    </button>

                    <Link
                        to="/"
                        aria-label="Thrifter home"
                        onClick={closeMobilePanels}
                        className={`flex items-center gap-1.5 rounded-md ${focusClasses}`}
                    >
                        <img src={logo} alt="" className="h-8 w-8 object-contain" />
                        <span className="font-display text-base font-bold uppercase tracking-wider text-pine min-[375px]:inline">
                            Thrifter
                        </span>
                    </Link>

                    <div className="flex items-center justify-end gap-0.5">
                        <Link
                            to={user ? "/account" : "/login"}
                            state={user ? undefined : { returnTo: location.pathname }}
                            onClick={closeMobilePanels}
                            aria-label={user ? `${user.name}'s account` : "Sign in or create account"}
                            className={`rounded-full p-2 text-rose-800 hover:bg-rose-100 ${focusClasses}`}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                                <UserRound aria-hidden="true" className="h-5 w-5" />
                            )}
                        </Link>
                        <button
                            type="button"
                            aria-label={showSearch ? "Close search" : "Open search"}
                            aria-expanded={showSearch}
                            disabled={!atTop}
                            onClick={() => {
                                setShowSearch((open) => !open);
                                setMenuOpen(false);
                            }}
                            className={`rounded-full p-2 text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 ${focusClasses}`}
                        >
                            <Search aria-hidden="true" className="h-5 w-5" />
                        </button>
                        {cartLink}
                    </div>
                </div>

                <div
                    className={`overflow-hidden px-3 transition-[max-height,opacity,padding] duration-300 ${
                        showSearch && atTop ? "max-h-20 pb-3 opacity-100" : "max-h-0 pb-0 opacity-0"
                    }`}
                >
                    {searchForm(true)}
                </div>

                {currentAnnouncement && (
                    <AnnouncementTicker
                        announcement={currentAnnouncement}
                        position={announcementIndex}
                        total={announcements.length}
                        compact
                    />
                )}

                <nav
                    aria-label="Mobile product categories"
                    className={`overflow-hidden border-t border-rose-100 transition-[max-height,opacity] duration-300 ${
                        menuOpen && !scrolled ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                    <ul className="px-3 py-2">
                        <li>
                            <Link
                                to={user ? "/account" : "/login"}
                                state={user ? undefined : { returnTo: location.pathname }}
                                onClick={closeMobilePanels}
                                className={`mb-1 flex items-center gap-2 rounded-md bg-pine px-3 py-2.5 text-sm font-semibold text-white ${focusClasses}`}
                            >
                                <UserRound aria-hidden="true" className="h-4 w-4" />
                                {user ? "My account" : "Sign in or create account"}
                            </Link>
                        </li>
                        {navItems.map(({ label, to }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    end={to === "/"}
                                    onClick={closeMobilePanels}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between rounded-md border-l-2 px-3 py-2.5 text-sm ${focusClasses} ${
                                            isActive
                                                ? "border-rose-700 bg-rose-100 font-semibold text-rose-950"
                                                : "border-transparent font-medium text-rose-700 hover:bg-rose-100 hover:text-rose-950"
                                        }`
                                    }
                                >
                                    {label}
                                    <ChevronDown aria-hidden="true" className="h-4 w-4" />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
