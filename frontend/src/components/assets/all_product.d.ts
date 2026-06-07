type Product = {
    id: number;
    name: string;
    category: string;
    image: string;
    new_price: number;
    old_price: number;
};

declare const allProducts: Product[];

export default allProducts;
