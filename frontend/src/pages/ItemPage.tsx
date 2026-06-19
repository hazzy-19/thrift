import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useCart } from "../context/cart-context";
import { getItem, type ItemDetail } from "../services/items";

const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));

const getDiscount = (item: ItemDetail) => {
    if (!item.original_price || Number(item.original_price) <= Number(item.price)) return 0;
    return Math.round(((Number(item.original_price) - Number(item.price)) / Number(item.original_price)) * 100);
};

const RatingStars = ({ rating }: { rating: number }) => (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                aria-hidden="true"
                className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-rose-800 text-rose-800" : "text-rose-200"}`}
            />
        ))}
    </span>
);

const ItemPage = () => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeImage, setActiveImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [saved, setSaved] = useState(false);
    const pointerStartX = useRef<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        getItem(id, controller.signal)
            .then((nextItem) => {
                setItem(nextItem);
                setActiveImage(0);
                setSelectedSize("");
                setQuantity(1);
            })
            .catch(() => {
                if (!controller.signal.aborted) setError("This Jersey World item could not be loaded.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [id]);

    const averageRating = useMemo(() => {
        if (!item?.reviews.length) return 0;
        return item.reviews.reduce((total, review) => total + review.rating, 0) / item.reviews.length;
    }, [item]);

    if (loading) {
        return <main className="mx-auto max-w-7xl px-4 py-12 text-pine sm:px-6 lg:px-8">Loading item...</main>;
    }

    if (error || !item) {
        return <main className="mx-auto max-w-7xl px-4 py-12 text-pine sm:px-6 lg:px-8">{error || "Item not found."}</main>;
    }

    const images = item.images.length ? item.images : [""];
    const discount = getDiscount(item);
    const stockText = item.stock_quantity <= 0 ? "Out of stock" : item.stock_quantity <= 3 ? `Only ${item.stock_quantity} left` : "In stock";
    const details = [
        ["Material", item.material],
        ["Fit", item.fit_type],
        ["Gender", item.gender],
        ["Sport", item.sport],
        ["League", item.league],
        ["Team", item.team],
        ["Jersey number", item.jersey_number],
        ...Object.entries(item.specs).map(([key, value]) => [key, String(value ?? "")]),
    ].filter(([, value]) => value);

    const showImage = (index: number) => {
        setActiveImage((index + images.length) % images.length);
    };

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (pointerStartX.current === null) return;
        const distance = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(distance) > 45) showImage(activeImage + (distance < 0 ? 1 : -1));
    };

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)}>
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </Button>

            <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                <div>
                    <div
                        className="relative overflow-hidden rounded-lg bg-rose-50"
                        onPointerDown={(event) => {
                            pointerStartX.current = event.clientX;
                        }}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={() => {
                            pointerStartX.current = null;
                        }}
                    >
                        {images[activeImage] ? (
                            <img className="aspect-[4/5] w-full object-cover" src={images[activeImage]} alt={item.name} />
                        ) : (
                            <div className="flex aspect-[4/5] items-center justify-center text-lg font-bold text-pine/60">
                                Jersey World
                            </div>
                        )}
                        {images.length > 1 && (
                            <>
                                <Button className="absolute left-3 top-1/2 -translate-y-1/2" variant="outline" size="icon" aria-label="Previous image" onClick={() => showImage(activeImage - 1)}>
                                    <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                                </Button>
                                <Button className="absolute right-3 top-1/2 -translate-y-1/2" variant="outline" size="icon" aria-label="Next image" onClick={() => showImage(activeImage + 1)}>
                                    <ChevronRight aria-hidden="true" className="h-5 w-5" />
                                </Button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            {images.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    aria-label={`Show image ${index + 1}`}
                                    onClick={() => showImage(index)}
                                    className={`overflow-hidden rounded-md border ${index === activeImage ? "border-pine" : "border-rose-100"}`}
                                >
                                    <img className="aspect-square w-full object-cover" src={image} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-bold uppercase text-rose-800">{item.brand}</p>
                        <h1 className="mt-2 text-3xl font-bold text-pine">{item.name}</h1>
                        <p className="mt-1 text-sm font-semibold capitalize text-pine/60">{item.category}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <p className="text-2xl font-bold text-rose-900">{formatCurrency(item.price)}</p>
                            {item.original_price && Number(item.original_price) > Number(item.price) && (
                                <p className="font-semibold text-pine/45 line-through">{formatCurrency(item.original_price)}</p>
                            )}
                            {discount > 0 && <Badge>{discount}% off</Badge>}
                        </div>
                    </div>

                    <Card>
                        <CardContent className="space-y-5">
                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-sm font-bold uppercase text-pine">Size</h2>
                                    <p className="text-sm font-semibold text-rose-800">{stockText}</p>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.available_sizes.map((size) => (
                                        <Button key={size} type="button" variant={selectedSize === size ? "default" : "outline"} onClick={() => setSelectedSize(size)}>
                                            {size}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-sm font-bold uppercase text-pine">Quantity</h2>
                                <div className="mt-3 inline-flex items-center rounded-md border border-rose-200">
                                    <Button variant="ghost" size="icon" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                                        <Minus aria-hidden="true" className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center font-bold">{quantity}</span>
                                    <Button variant="ghost" size="icon" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(100, value + 1))}>
                                        <Plus aria-hidden="true" className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <Button disabled={!selectedSize || item.stock_quantity <= 0} onClick={() => addItem(item.id, selectedSize, quantity)}>
                                    <ShoppingBag aria-hidden="true" className="mr-2 h-4 w-4" />
                                    Add to Cart
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setSaved((value) => !value)}>
                                    <Heart aria-hidden="true" className={`mr-2 h-4 w-4 ${saved ? "fill-rose-800" : ""}`} />
                                    {saved ? "Saved" : "Save"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <section>
                        <h2 className="text-xl font-bold text-pine">Description</h2>
                        <div className="mt-3 space-y-3 text-sm leading-6 text-pine/75">
                            {item.description.split(/\n{2,}/).map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </section>

                    {details.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-pine">Key Details</h2>
                            <dl className="mt-3 grid grid-cols-2 gap-3">
                                {details.map(([label, value]) => (
                                    <div className="rounded-lg bg-rose-50 p-3" key={label}>
                                        <dt className="text-xs font-bold uppercase text-rose-800">{label}</dt>
                                        <dd className="mt-1 text-sm font-semibold text-pine">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    <Accordion>
                        <AccordionItem open>
                            <AccordionTrigger>Shipping & returns</AccordionTrigger>
                            <AccordionContent>
                                Jersey World ships with tracked delivery. Unworn items with tags can be returned within 14 days.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            <section className="mt-12">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-pine">Customer Reviews</h2>
                    <RatingStars rating={averageRating} />
                    <p className="text-sm font-semibold text-pine/60">
                        {averageRating.toFixed(1)} average, {item.reviews.length} reviews
                    </p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {item.reviews.length ? (
                        item.reviews.map((review) => (
                            <Card key={review.id}>
                                <CardContent>
                                    <RatingStars rating={review.rating} />
                                    <h3 className="mt-3 font-bold text-pine">{review.title || "Verified Jersey World customer"}</h3>
                                    <p className="mt-2 text-sm leading-6 text-pine/70">{review.body}</p>
                                    <p className="mt-3 text-xs font-bold uppercase text-rose-800">{review.customer_name}</p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="rounded-lg bg-rose-50 p-6 font-semibold text-pine">No reviews yet.</p>
                    )}
                </div>
            </section>

            {item.suggested_items.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-2xl font-bold text-pine">You may also like</h2>
                    <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {item.suggested_items.map((suggestedItem) => (
                            <li key={suggestedItem.id}>
                                <ProductCard item={suggestedItem} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </main>
    );
};

export default ItemPage;
