import { useEffect, useRef, useState, type PointerEvent } from "react";
import ProductGrid, { type PromotionFilter } from "../components/ProductGrid";
import clearanceImage from "../assets/hero/clearance.jpg";
import kidsImage from "../assets/hero/kids.jpg";
import womenImage from "../assets/hero/women.jpg";
import worldCupImage from "../assets/hero/world-cup.jpg";

type HomePageProps = {
    searchQuery: string;
};

type Promotion = {
    label: string;
    title: string;
    accent: string;
    description: string;
    image: string;
    filter: PromotionFilter;
};

const promotions: Promotion[] = [
    {
        label: "Match-day edit",
        title: "World Cup",
        accent: "jerseys are here.",
        description: "Find match-ready jerseys and performance layers before the next kickoff.",
        image: worldCupImage,
        filter: "men",
    },
    {
        label: "Fresh arrivals",
        title: "New looks.",
        accent: "Game-ready energy.",
        description: "Discover standout women's sportswear selected for training days and match days.",
        image: womenImage,
        filter: "women",
    },
    {
        label: "Weekend picks",
        title: "Small sizes.",
        accent: "Big personality.",
        description: "Easy, colorful kits chosen for kids who never stop moving.",
        image: kidsImage,
        filter: "kids",
    },
    {
        label: "Clearance sale",
        title: "More style.",
        accent: "Less spend.",
        description: "The biggest Jersey World markdowns come first, with more sportswear below.",
        image: clearanceImage,
        filter: "clearance",
    },
];

const HomePage = ({ searchQuery }: HomePageProps) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [promotionFilter, setPromotionFilter] = useState<PromotionFilter>("all");
    const pointerStartX = useRef<number | null>(null);
    const pointerSwiped = useRef(false);
    const currentPromotion = promotions[activeSlide];

    const showSlide = (index: number) => {
        setActiveSlide((index + promotions.length) % promotions.length);
    };

    const applyPromotion = () => {
        setPromotionFilter(currentPromotion.filter);
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
        pointerStartX.current = event.clientX;
        pointerSwiped.current = false;
    };

    const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
        if (pointerStartX.current === null) return;

        const distance = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(distance) < 45) return;

        pointerSwiped.current = true;
        showSlide(activeSlide + (distance < 0 ? 1 : -1));
    };

    const handleHeroClick = () => {
        if (pointerSwiped.current) {
            pointerSwiped.current = false;
            return;
        }
        applyPromotion();
    };

    useEffect(() => {
        const intervalId = window.setInterval(() => showSlide(activeSlide + 1), 7_000);
        return () => window.clearInterval(intervalId);
    }, [activeSlide]);

    return (
        <main>
            <section
                id="home-hero"
                aria-roledescription="carousel"
                aria-label={`${currentPromotion.label}. Click to shop this promotion.`}
                tabIndex={0}
                onClick={handleHeroClick}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applyPromotion();
                    }
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                    pointerStartX.current = null;
                }}
                className="relative isolate -mt-[89px] flex min-h-[620px] cursor-pointer touch-pan-y select-none overflow-hidden bg-pine pt-[89px] text-white md:-mt-[113px] md:min-h-[720px] md:pt-[113px]"
            >
                {promotions.map((promotion, index) => (
                    <img
                        key={promotion.image}
                        src={promotion.image}
                        alt=""
                        aria-hidden={index !== activeSlide}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-in-out ${
                            index === activeSlide ? "opacity-100" : "opacity-0"
                        }`}
                    />
                ))}
                <div className="home-hero-pine-filter absolute inset-0" />

                <div className="relative mx-auto flex w-full max-w-7xl items-end px-4 pb-16 sm:px-6 lg:px-8">
                    <div key={activeSlide} className="hero-slide-content max-w-sm pb-4 md:max-w-md">
                        <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                            {currentPromotion.title}
                            <span className="block text-rose-800">{currentPromotion.accent}</span>
                        </h1>
                        <p className="mt-3 max-w-sm text-xs leading-5 text-white/80 sm:text-sm">
                            {currentPromotion.description}
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {promotions.map((promotion, index) => (
                        <button
                            key={promotion.label}
                            type="button"
                            aria-label={`Show ${promotion.label}`}
                            aria-current={index === activeSlide}
                            onClick={(event) => {
                                event.stopPropagation();
                                showSlide(index);
                            }}
                            className={`h-2.5 rounded-full transition-[width,background-color] ${
                                index === activeSlide ? "w-8 bg-pine" : "w-2.5 bg-white/75"
                            }`}
                        />
                    ))}
                </div>
            </section>

            <section id="shop" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Shop Jersey World</p>
                        <h2 className="mt-1 text-3xl font-bold text-rose-950">
                            All sportswear
                        </h2>
                    </div>
                    {promotionFilter !== "all" && (
                        <button
                            type="button"
                            onClick={() => setPromotionFilter("all")}
                            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-pine hover:bg-rose-50"
                        >
                            Reset view
                        </button>
                    )}
                </div>
                <ProductGrid query={searchQuery} promotionFilter={promotionFilter} />
            </section>
        </main>
    );
};

export default HomePage;
