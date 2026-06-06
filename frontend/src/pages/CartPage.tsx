const CartPage = () => {
    return (
        <main className="mx-auto max-w-4xl p-8">
            <h1 className="mb-6 text-2xl font-bold text-rose-900">Your Cart</h1>
            <section className="rounded-lg border border-rose-100 bg-white p-6 shadow-sm">
                <p className="text-gray-600">Your cart is currently empty.</p>
            </section>
        </main>
    );
};

export default CartPage;
