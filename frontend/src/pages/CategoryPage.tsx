import ProductGrid from "../components/ProductGrid";

type CategoryPageProps = {
    category: string;
    searchQuery: string;
    title: string;
};

const CategoryPage = ({ category, searchQuery, title }: CategoryPageProps) => {
    return (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-rose-950">{title}</h1>
            <ProductGrid category={category} query={searchQuery} />
        </main>
    );
};

export default CategoryPage;
