import { useCart } from "../context/cart-context";

const CartPage = () => {
    const { items, removeItem, setQuantity, syncing } = useCart();

    return (
        <main className="mx-auto max-w-4xl p-8">
            <h1 className="mb-6 text-2xl font-bold text-rose-900">Your Cart</h1>
            <section className="rounded-lg border border-rose-100 bg-white p-6 shadow-sm">
                {syncing && <p className="mb-4 text-sm text-gray-500">Syncing your cart...</p>}
                {items.length === 0 ? (
                    <p className="text-gray-600">Your cart is currently empty.</p>
                ) : (
                    <ul className="divide-y divide-rose-100">
                        {items.map((item) => (
                            <li
                                className="flex items-center justify-between gap-4 py-4"
                                key={`${item.productId}:${item.variantId}`}
                            >
                                <div>
                                    <p className="font-semibold text-rose-950">
                                        Product {item.productId}
                                    </p>
                                    {item.variantId && (
                                        <p className="text-sm text-gray-500">
                                            Variant {item.variantId}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        aria-label={`Quantity for product ${item.productId}`}
                                        className="w-16 rounded border border-rose-200 px-2 py-1"
                                        min="1"
                                        onChange={(event) =>
                                            setQuantity(
                                                item.productId,
                                                item.variantId,
                                                Number(event.target.value),
                                            )
                                        }
                                        type="number"
                                        value={item.quantity}
                                    />
                                    <button
                                        className="text-sm font-semibold text-rose-700"
                                        onClick={() => removeItem(item.productId, item.variantId)}
                                        type="button"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
};

export default CartPage;
