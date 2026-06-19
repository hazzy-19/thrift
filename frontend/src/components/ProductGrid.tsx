import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { listItems, type ItemSummary } from "../services/items";

type ProductGridProps = {
    category?: string;
    query: string;
    promotionFilter?: PromotionFilter;
};

export type PromotionFilter = "all" | "women" | "men" | "kids" | "clearance";

const ProductGrid = ({ category, query, promotionFilter = "all" }: ProductGridProps) => {
    const [products, setProducts] = useState<ItemSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const effectiveCategory = category ?? (promotionFilter !== "all" && promotionFilter !== "clearance" ? promotionFilter : undefined);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");

        listItems({ category: effectiveCategory, query, signal: controller.signal })
            .then((items) => {
                const sortedItems =
                    promotionFilter === "clearance"
                        ? [...items].sort((a, b) => {
                              const discountA = Number(a.original_price ?? a.price) - Number(a.price);
                              const discountB = Number(b.original_price ?? b.price) - Number(b.price);
                              return discountB - discountA;
                          })
                        : items;
                setProducts(sortedItems);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setError("Unable to load Jersey World items.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [effectiveCategory, promotionFilter, query]);

    if (loading) {
        return <p className="mt-8 rounded-lg bg-rose-50 p-6 text-center font-semibold text-pine">Loading jerseys...</p>;
    }

    if (error) {
        return <p className="mt-8 rounded-lg bg-rose-50 p-6 text-center font-semibold text-pine">{error}</p>;
    }

    if (products.length === 0) {
        return (
            <p className="mt-8 rounded-lg bg-rose-50 p-6 text-center font-semibold text-pine">
                No Jersey World items found on this page.
            </p>
        );
    }

    return (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard item={product} />
                </li>
            ))}
        </ul>
    );
};

export default ProductGrid;
