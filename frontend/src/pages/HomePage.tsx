import ProductGrid from "../components/ProductGrid";

type HomePageProps = {
    searchQuery: string;
};

const HomePage = ({ searchQuery }: HomePageProps) => {
    return (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-rose-950">Shop</h1>
            <ProductGrid query={searchQuery} />
        </main>
    );
};

export default HomePage;
