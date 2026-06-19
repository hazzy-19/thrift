import { Link } from "react-router-dom";
import type { ItemSummary } from "../services/items";
import { Card, CardContent } from "./ui/card";

const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));

const ProductCard = ({ item }: { item: ItemSummary }) => {
    const image = item.images[0];

    return (
        <Card className="overflow-hidden">
            <Link to={`/items/${item.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine">
                {image ? (
                    <img className="aspect-[3/4] w-full object-cover" src={image} alt={item.name} />
                ) : (
                    <div className="flex aspect-[3/4] items-center justify-center bg-rose-50 text-sm font-semibold text-pine/60">
                        Jersey World
                    </div>
                )}
                <CardContent className="p-3">
                    <p className="text-xs font-bold uppercase text-rose-800">{item.brand || item.category}</p>
                    <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-pine">{item.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="font-bold text-rose-900">{formatCurrency(item.price)}</p>
                        {item.original_price && Number(item.original_price) > Number(item.price) && (
                            <p className="text-xs font-semibold text-pine/50 line-through">
                                {formatCurrency(item.original_price)}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};

export default ProductCard;
