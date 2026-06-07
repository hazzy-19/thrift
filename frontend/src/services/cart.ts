import { firebaseAuth } from "./firebase";

export type CartItem = {
    productId: string;
    variantId: string;
    quantity: number;
};

type CartResponse = {
    items: Array<{
        product_id: string;
        variant_id: string;
        quantity: number;
    }>;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const mergeLocalCart = async (items: CartItem[]): Promise<CartItem[]> => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
        throw new Error("Sign in before merging the cart.");
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`${apiBaseUrl}/api/cart/merge`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            items: items.map((item) => ({
                product_id: item.productId,
                variant_id: item.variantId,
                quantity: item.quantity,
            })),
        }),
    });

    if (!response.ok) {
        throw new Error("Unable to sync your cart.");
    }

    const data = (await response.json()) as CartResponse;
    return data.items.map((item) => ({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
    }));
};
