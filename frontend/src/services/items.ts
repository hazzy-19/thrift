export type ItemSummary = {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: string;
    original_price: string | null;
    images: string[];
    stock_quantity: number;
};

export type ItemReview = {
    id: string;
    customer_name: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
};

export type ItemDetail = ItemSummary & {
    description: string;
    available_sizes: string[];
    material: string;
    fit_type: string;
    gender: string;
    sport: string;
    league: string;
    team: string;
    jersey_number: string;
    specs: Record<string, string | number | boolean | null>;
    reviews: ItemReview[];
    suggested_items: ItemSummary[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const readJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        throw new Error("Unable to load Jersey World items.");
    }
    return (await response.json()) as T;
};

export const listItems = async ({
    category,
    query,
    signal,
}: {
    category?: string;
    query?: string;
    signal?: AbortSignal;
} = {}): Promise<ItemSummary[]> => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query?.trim()) params.set("query", query.trim());
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return readJson<ItemSummary[]>(await fetch(`${apiBaseUrl}/api/items${suffix}`, { signal }));
};

export const getItem = async (id: string, signal?: AbortSignal): Promise<ItemDetail> => {
    return readJson<ItemDetail>(await fetch(`${apiBaseUrl}/api/items/${encodeURIComponent(id)}`, { signal }));
};
