import { createContext, useContext } from "react";
import type { CartItem } from "../services/cart";

export type CartContextValue = {
    items: CartItem[];
    itemCount: number;
    syncing: boolean;
    addItem: (productId: string, variantId?: string, quantity?: number) => void;
    setQuantity: (productId: string, variantId: string, quantity: number) => void;
    removeItem: (productId: string, variantId?: string) => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider.");
    }
    return context;
};
