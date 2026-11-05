import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CartLine = { listingId: number; quantity: number };
type MarketplaceCartValue = {
  items: CartLine[];
  itemCount: number;
  addItem: (listingId: number, quantity?: number) => void;
  setQuantity: (listingId: number, quantity: number) => void;
  removeItem: (listingId: number) => void;
  clearCart: () => void;
};
const STORAGE_KEY = "buyinbales-marketplace-cart";
const CartContext = createContext<MarketplaceCartValue | null>(null);
function readCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        Boolean(line) &&
        Number.isInteger(line.listingId) &&
        line.listingId > 0 &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0
    );
  } catch {
    return [];
  }
}
export function MarketplaceCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartLine[]>(readCart);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);
  const addItem = useCallback(
    (listingId: number, quantity = 1) =>
      setItems(current => {
        const found = current.find(line => line.listingId === listingId);
        return found
          ? current.map(line =>
              line.listingId === listingId
                ? { ...line, quantity: line.quantity + quantity }
                : line
            )
          : [...current, { listingId, quantity }];
      }),
    []
  );
  const setQuantity = useCallback(
    (listingId: number, quantity: number) =>
      setItems(current =>
        quantity < 1
          ? current.filter(line => line.listingId !== listingId)
          : current.map(line =>
              line.listingId === listingId ? { ...line, quantity } : line
            )
      ),
    []
  );
  const removeItem = useCallback(
    (listingId: number) =>
      setItems(current => current.filter(line => line.listingId !== listingId)),
    []
  );
  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, setQuantity, removeItem, clearCart]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useMarketplaceCart() {
  const value = useContext(CartContext);
  if (!value)
    throw new Error(
      "useMarketplaceCart must be used inside MarketplaceCartProvider"
    );
  return value;
}
