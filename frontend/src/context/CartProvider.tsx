import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useAuth } from "./auth-context";
import { CartContext } from "./cart-context";
import { mergeLocalCart, type CartItem } from "../services/cart";

const STORAGE_KEY = "jersey-world:guest-cart";

const loadGuestCart = (): CartItem[] => {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value ? (JSON.parse(value) as CartItem[]) : [];
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
};

const CartProvider = ({ children }: PropsWithChildren) => {
    const { user, loading } = useAuth();
    const [items, setItems] = useState<CartItem[]>(loadGuestCart);
    const [syncing, setSyncing] = useState(false);
    const syncedUserId = useRef<string | null>(null);
    const wasAuthenticated = useRef(false);

    useEffect(() => {
        if (!user && !wasAuthenticated.current) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, user]);

    useEffect(() => {
        if (user) {
            wasAuthenticated.current = true;
        } else if (!loading && wasAuthenticated.current) {
            wasAuthenticated.current = false;
            syncedUserId.current = null;
            localStorage.removeItem(STORAGE_KEY);
            setItems([]);
        }
    }, [loading, user]);

    useEffect(() => {
        if (loading || !user || syncedUserId.current === user.id) {
            return;
        }

        let cancelled = false;
        setSyncing(true);
        mergeLocalCart(loadGuestCart())
            .then((databaseItems) => {
                if (cancelled) return;
                localStorage.removeItem(STORAGE_KEY);
                syncedUserId.current = user.id;
                setItems(databaseItems);
            })
            .catch(() => {
                // Keep the local copy so the next auth event or page load can retry safely.
            })
            .finally(() => {
                if (!cancelled) setSyncing(false);
            });

        return () => {
            cancelled = true;
        };
    }, [loading, user]);

    const value = useMemo(
        () => ({
            items,
            itemCount: items.reduce((total, item) => total + item.quantity, 0),
            syncing,
            addItem: (productId: string, variantId = "", quantity = 1) =>
                setItems((current) => {
                    const existing = current.find(
                        (item) => item.productId === productId && item.variantId === variantId,
                    );
                    if (!existing) return [...current, { productId, variantId, quantity }];
                    return current.map((item) =>
                        item === existing ? { ...item, quantity: item.quantity + quantity } : item,
                    );
                }),
            setQuantity: (productId: string, variantId: string, quantity: number) =>
                setItems((current) =>
                    quantity <= 0
                        ? current.filter(
                              (item) => item.productId !== productId || item.variantId !== variantId,
                          )
                        : current.map((item) =>
                              item.productId === productId && item.variantId === variantId
                                  ? { ...item, quantity }
                                  : item,
                          ),
                ),
            removeItem: (productId: string, variantId = "") =>
                setItems((current) =>
                    current.filter(
                        (item) => item.productId !== productId || item.variantId !== variantId,
                    ),
                ),
        }),
        [items, syncing],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
