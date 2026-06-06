type CategoryPageProps = {
    title: string;
};

const CategoryPage = ({ title }: CategoryPageProps) => {
    return (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-rose-950">{title}</h1>
        </main>
    );
};

export default CategoryPage;
