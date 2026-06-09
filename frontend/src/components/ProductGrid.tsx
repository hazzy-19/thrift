import allProducts from "./assets/all_product.js";

type Product = {
    id: number;
    name: string;
    category: string;
    image: string;
    new_price: number;
    old_price: number;
};

type ProductGridProps = {
    category?: string;
    query: string;
    promotionFilter?: PromotionFilter;
};

export type PromotionFilter = "all" | "women" | "men" | "kid" | "clearance";

const products = allProducts as Product[];

const ProductGrid = ({ category, query, promotionFilter = "all" }: ProductGridProps) => {
    const normalizedQuery = query.trim().toLowerCase();
    const visibleProducts = products
        .filter(
            (product) =>
                (!category || product.category === category) &&
                (!normalizedQuery ||
                    product.name.toLowerCase().includes(normalizedQuery) ||
                    product.category.toLowerCase().includes(normalizedQuery)),
        )
        .map((product, originalIndex) => ({ product, originalIndex }))
        .sort((a, b) => {
            if (promotionFilter === "clearance") {
                const discountA = (a.product.old_price - a.product.new_price) / a.product.old_price;
                const discountB = (b.product.old_price - b.product.new_price) / b.product.old_price;
                return discountB - discountA || a.originalIndex - b.originalIndex;
            }

            if (promotionFilter !== "all") {
                const aMatches = a.product.category === promotionFilter ? 1 : 0;
                const bMatches = b.product.category === promotionFilter ? 1 : 0;
                return bMatches - aMatches || a.originalIndex - b.originalIndex;
            }

            return a.originalIndex - b.originalIndex;
        })
        .map(({ product }) => product);

    if (visibleProducts.length === 0) {
        return (
            <p className="mt-8 rounded-xl bg-rose-50 p-6 text-center font-semibold text-pine">
                No products found on this page.
            </p>
        );
    }

    return (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
                <li className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-rose-100" key={product.id}>
                    <img className="aspect-[3/4] w-full object-cover" src={product.image} alt={product.name} />
                    <div className="p-3">
                        <h2 className="line-clamp-2 text-sm font-semibold text-pine">{product.name}</h2>
                        <p className="mt-2 font-bold text-rose-900">${product.new_price.toFixed(2)}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ProductGrid;
