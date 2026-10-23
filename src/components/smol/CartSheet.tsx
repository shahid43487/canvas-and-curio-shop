import { assetUrl } from "@/lib/asset-url";
import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/data/products";
import { useCart, itemKey, unitPrice } from "@/hooks/use-cart";
import { useDialogue, dialogueReadingTime } from "@/hooks/use-dialogue";
import { resolveStickerSrc, useSite } from "@/lib/site";
import { ProductImage } from "./ProductImage";
import fierceCharacter from "@/assets/cart-fierce-character.png";

import { CART_EMPTY, CART_ONE, CART_MANY, CART_HIGH, CART_LOW, CART_REMOVED } from "@/data/dialogue-defaults";

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const isSecretCart = items.some((item) => item.product.is_hidden === true);
  const site = useSite();
  const { dialogue, saySequence, configuredSequence, linesFor } = useDialogue(CART_EMPTY[0] ?? { line: "", expression: "hmm" });
  const assignedStickerSrc = resolveStickerSrc(dialogue.stickerId, site?.stickers.custom);
  const tick = useRef(0);
  const prevCount = useRef(totalItems);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (totalItems < prevCount.current) configuredSequence("cart-remove", CART_REMOVED, 2);
    prevCount.current = totalItems;
  }, [totalItems, configuredSequence]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("smol-cart-visibility", { detail: { open: isOpen } }));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) { wasOpen.current = false; return; }
    const justOpened = !wasOpen.current;
    wasOpen.current = true;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = (opening = false) => {
      const index = tick.current++;
      const [id, fb] = totalItems === 0 ? ["cart-empty", CART_EMPTY] as const
        : totalPrice >= 50 ? ["cart-high", CART_HIGH] as const
        : totalItems === 1 ? totalPrice < 18 && index % 3 === 2 ? ["cart-low", CART_LOW] as const : ["cart-single", CART_ONE] as const
        : ["cart-many", CART_MANY] as const;
      const lines = linesFor(id, fb);
      const pick = lines[index % lines.length] ?? { line: "", expression: "hmm" };
      const line = pick.line;
      saySequence([pick], opening ? 1 : 0);
      timer = setTimeout(() => cycle(), dialogueReadingTime(line) + 150);
    };
    cycle(justOpened);
    return () => clearTimeout(timer);
  }, [isOpen, totalItems, totalPrice, linesFor, saySequence]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="cart-sheet">
        <img
          className="cart-comedy-sticker"
          src={assignedStickerSrc || assetUrl(fierceCharacter)}
          alt={dialogue.stickerId ? "Assigned dialogue sticker" : "Shop character judging your cart"}
          loading="lazy"
        />
        <SheetHeader className="cart-sheet-header">
          <span className="cart-tape" aria-hidden="true" />
          <SheetTitle className="cart-sheet-title" lang="bn">কি কি নিলেন দেখি ?</SheetTitle>
          <span className="cart-count-sticker">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
        </SheetHeader>

        <p key={dialogue.line} className="speech-bubble" lang="bn" aria-live="polite">{dialogue.line}</p>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <Button asChild className="btn-primary">
              <Link to="/shop" onClick={() => setIsOpen(false)}>Shop the drop</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={itemKey(item)} className="cart-item">
                  <div className="cart-item-image"><ProductImage id={item.product.id} src={item.product.image_key} name={item.product.name} /></div>
                  <div className="cart-item-main">
                    <span className="cart-item-name">{item.product.name}{item.variation ? ` · ${item.variation.name}` : ""}</span>
                    <span className="cart-item-price">{formatPrice(unitPrice(item))}</span>
                  </div>
                  <div className="cart-item-actions">
                    <Button type="button" variant="ghost" size="icon" className="qty-btn" onClick={() => updateQuantity(itemKey(item), item.quantity - 1)} aria-label="Decrease quantity">
                      <Minus size={14} />
                    </Button>
                    <span className="qty-value">{item.quantity}</span>
                    <Button type="button" variant="ghost" size="icon" className="qty-btn" onClick={() => updateQuantity(itemKey(item), item.quantity + 1)} aria-label="Increase quantity">
                      <Plus size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="cart-remove" onClick={() => removeItem(itemKey(item))} aria-label="Remove item">
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
              <Button asChild className="add-cart button-spring w-full" onMouseEnter={() => saySequence([CART_MANY[1] ?? { line: "", expression: "shush" }])} onFocus={() => saySequence([CART_MANY[1] ?? { line: "", expression: "shush" }])}>
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
