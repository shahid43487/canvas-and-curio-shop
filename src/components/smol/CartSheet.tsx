import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/data/products";
import { useCart } from "@/hooks/use-cart";
import { ProductImage } from "./ProductImage";
import babuRaoSticker from "@/assets/babu-pointing-laugh.png";

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const isSecretCart = items.some((item) => item.product.is_hidden === true);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="cart-sheet">
        <img
          className="cart-comedy-sticker"
          src={babuRaoSticker}
          alt="A surprised Babu Rao sticker peeking into the cart"
          loading="lazy"
          width={1024}
          height={1024}
        />
        <SheetHeader className="cart-sheet-header">
          <span className="cart-tape" aria-hidden="true" />
          <SheetTitle className="cart-sheet-title">
            Your Basta
          </SheetTitle>
          <span className="cart-count-sticker">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <p>Kuch to kharid le bawa re bawa !!!</p>
            <Button asChild className="btn-primary">
              <Link to="/shop" onClick={() => setIsOpen(false)}>
                Shop the drop
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-image"><ProductImage id={item.product.id} name={item.product.name} /></div>
                  <div className="cart-item-main">
                    <span className="cart-item-name">{item.product.name}</span>
                    <span className="cart-item-price">{formatPrice(item.product.price)}</span>
                  </div>
                  <div className="cart-item-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="qty-btn"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="qty-value">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="qty-btn"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="cart-remove"
                      onClick={() => removeItem(item.product.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="cart-footer">
              <div className="cart-total">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <p className="cart-blooper">Arrey! One more tiny thing won't hurt.</p>
              <Button asChild className="add-cart button-spring w-full">
                <Link to="/checkout" onClick={() => setIsOpen(false)}>
                  {isSecretCart ? "Advance checkout" : "Checkout"}
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
