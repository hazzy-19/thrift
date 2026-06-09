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
    onSearchChange: (query: string) => void;
    searchQuery: string;
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

const Navbar = ({ cartCount, onSearchChange, searchQuery, user }: NavbarProps) => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [overHero, setOverHero] = useState(location.pathname === "/");
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const headerRef = useRef<HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const displayedCartCount = cartCount > 99 ? "99+" : cartCount;

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isScrolled = currentScrollY > 10;
            const hero = location.pathname === "/" ? document.getElementById("home-hero") : null;

            setScrolled(isScrolled);
            setOverHero(
                Boolean(hero && hero.getBoundingClientRect().bottom > (headerRef.current?.offsetHeight ?? 0)),
            );

            if (currentScrollY > 0) {
                setMenuOpen(false);
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, [location.pathname]);

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
            } catch {
                if (!controller.signal.aborted) {
                    setAnnouncements([]);
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

    const currentAnnouncement = announcements[0];

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
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-900"
            />
            <input
                ref={mobile ? searchInputRef : undefined}
                id={mobile ? "mobile-search" : "desktop-search"}
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className={`w-full rounded-full border border-rose-200 bg-white py-2 pl-10 text-sm text-rose-950 placeholder:text-rose-400 transition-colors hover:border-rose-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 ${
                    mobile ? "pr-10" : "pr-4"
                }`}
            />
            {mobile && (
                <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setShowSearch(false)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-rose-900 hover:bg-rose-100 ${focusClasses}`}
                >
                    <X aria-hidden="true" className="h-4 w-4 text-rose-900" />
                </button>
            )}
        </form>
    );

    const cartLink = (
        <Link
            to="/cart"
            onClick={closeMobilePanels}
            aria-label={`Shopping cart with ${Math.max(0, cartCount)} ${cartCount === 1 ? "item" : "items"}`}
            className={`relative rounded-full p-2 text-rose-900 transition-colors hover:bg-rose-100 ${focusClasses}`}
        >
            <ShoppingBag aria-hidden="true" className="h-5 w-5 text-rose-900 md:h-6 md:w-6" />
            {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-800 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-rose-50">
                    {displayedCartCount}
                </span>
            )}
        </Link>
    );

    return (
        <header
            ref={headerRef}
            className={`header-on-pine sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
                overHero
                    ? "header-over-hero border-transparent shadow-none"
                    : `border-white/10 bg-pine/95 backdrop-blur ${scrolled ? "shadow-md" : "shadow-sm"}`
            }`}
        >
            <div className={overHero ? "bg-transparent" : "bg-pine/95 backdrop-blur"}>
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
                                    className="h-7 w-7 rounded-full bg-brand-pink p-1 text-rose-900"
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
                            <UserRound aria-hidden="true" className="h-5 w-5 text-rose-900" />
                            <span>Sign in</span>
                        </Link>
                    )}
                    <Link
                        to="/wishlist"
                        aria-label="Wishlist"
                        className={`rounded-full p-2 text-rose-900 transition-colors hover:bg-rose-100 ${focusClasses}`}
                    >
                        <Heart aria-hidden="true" className="h-5 w-5 text-rose-900 md:h-6 md:w-6" />
                    </Link>
                    {cartLink}
                </div>
                </div>
            </div>

            <div
                className={`hidden border-t border-white/10 transition-colors duration-300 md:block ${
                    overHero ? "border-transparent bg-transparent" : "bg-pine/95 backdrop-blur"
                }`}
            >
                <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 lg:px-8">
                    <nav aria-label="Product categories" className="w-1/2">
                        <ul className="flex items-center gap-5 lg:gap-8">
                            {navItems.map(({ label, to }) => (
                                <li key={to}>
                                    <NavLink
                                        to={to}
                                        end={to === "/"}
                                        className={({ isActive }) =>
                                            `flex items-center gap-1 border-b-2 py-3 text-sm transition-colors ${focusClasses} ${
                                                isActive
                                                    ? "border-rose-700 font-semibold text-white"
                                                    : "border-transparent font-medium text-rose-100 hover:border-rose-300 hover:text-white"
                                            }`
                                        }
                                    >
                                        {label}
                                        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-rose-900" />
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    {currentAnnouncement && (
                        <div className="w-1/2 min-w-0">
                            <AnnouncementTicker
                                announcement={currentAnnouncement}
                                announcements={announcements}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="relative md:hidden">
                <div
                    className={`grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2 ${
                        overHero ? "bg-transparent" : "bg-pine/95 backdrop-blur"
                    }`}
                >
                    <button
                        type="button"
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={menuOpen}
                        onClick={() => {
                            setMenuOpen((open) => !open);
                            setShowSearch(false);
                        }}
                        className={`w-fit rounded-full p-2 text-rose-900 hover:bg-rose-100 ${focusClasses}`}
                    >
                        {menuOpen ? (
                            <X aria-hidden="true" className="h-6 w-6 text-rose-900" />
                        ) : (
                            <Menu aria-hidden="true" className="h-6 w-6 text-rose-900" />
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
                            className={`rounded-full p-2 text-rose-900 hover:bg-rose-100 ${focusClasses}`}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                                <UserRound aria-hidden="true" className="h-5 w-5 text-rose-900" />
                            )}
                        </Link>
                        <button
                            type="button"
                            aria-label={showSearch ? "Close search" : "Open search"}
                            aria-expanded={showSearch}
                            onClick={() => {
                                setShowSearch((open) => !open);
                                setMenuOpen(false);
                            }}
                            className={`rounded-full p-2 text-rose-900 hover:bg-rose-100 ${focusClasses}`}
                        >
                            <Search aria-hidden="true" className="h-5 w-5 text-rose-900" />
                        </button>
                        {cartLink}
                    </div>
                </div>

                <div
                    className={`overflow-hidden px-3 transition-[max-height,opacity,padding] duration-300 ${
                        overHero ? "bg-transparent" : "bg-pine/95 backdrop-blur"
                    } ${
                        showSearch ? "max-h-20 pb-3 opacity-100" : "max-h-0 pb-0 opacity-0"
                    }`}
                >
                    {searchForm(true)}
                </div>

                {currentAnnouncement && (
                    <div
                        className={`transition-colors duration-300 ${
                            overHero ? "bg-transparent" : "bg-pine/95 backdrop-blur"
                        }`}
                    >
                        <AnnouncementTicker
                            announcement={currentAnnouncement}
                            announcements={announcements}
                            compact
                        />
                    </div>
                )}

                <nav
                    aria-label="Mobile product categories"
                    className={`absolute left-3 right-3 top-full z-20 overflow-hidden rounded-xl border border-white/10 bg-pine/95 shadow-xl backdrop-blur transition-[max-height,opacity,transform] duration-300 ${
                        menuOpen && !scrolled
                            ? "max-h-80 translate-y-2 opacity-100"
                            : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
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
                                <UserRound aria-hidden="true" className="h-4 w-4 text-rose-900" />
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
                                        `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${focusClasses} ${
                                            isActive
                                                ? "bg-rose-800 font-semibold text-white"
                                                : "font-medium text-white hover:bg-white/10"
                                        }`
                                    }
                                >
                                    {label}
                                    <ChevronDown aria-hidden="true" className="h-4 w-4 text-rose-900" />
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
