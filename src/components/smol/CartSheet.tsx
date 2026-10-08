import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/data/products";
import { useCart } from "@/hooks/use-cart";
import { dialogueReadingTime, useDialogue } from "@/hooks/use-dialogue";
import { ProductImage } from "./ProductImage";
import fierceCharacter from "@/assets/cart-fierce-character.png.asset.json";

const EMPTY = [
  "ভাই, কার্টে বাতাস ছাড়া আর কিছু নাই!",
  "এইটা কী ভাই! কার্ট একদম খালি?",
  "এতক্ষণ ঘুরলেন, কিনলেন কী?",
  "ভাই, শুধু দেখলে তো হবে না… কিছু একটা নেন!",
  "কার্ট খালি রাখছেন কেন? মানুষজন কী ভাববে?",
  "একটা জিনিসও পছন্দ হলো না? সমস্যা আছে ভাই।",
  "এই কার্টের অবস্থা দেখে আমারই খারাপ লাগতেছে।",
  "ভাই, খালি হাতে যাইয়েন না… মান-সম্মান আছে।",
  "আপনি কি শপিং করতে আসছেন, নাকি ঘুরতে?",
];
const ONE = [
  "একটা জিনিস নিয়া এত হিসাব কইরেন না ভাই!",
  "একটা নিলে হবে? আরেকটা নেন ভাই।",
  "এই একটা দিয়ে কী হবে? আরেকটা দেন।",
  "ভাই, যেহেতু শুরু করছেন… শেষ করেন।",
  "একটা জিনিস নিয়া এত খুশি হওয়ার কী আছে?",
  "আরেকটা নেন। পরে আফসোস করবেন।",
  "ভাই, কার্টে জায়গা আছে… সমস্যা কোথায়?",
  "একটা আপনার জন্য, একটা বাসার জন্য—বুদ্ধি করে চলেন।",
  "এইটা ভালো হইছে… এখন আরেকটা নেন।",
];
const TWO = "এইবার হইছে। মানুষজনের মতো লাগতেছে।";
const ALMOST = "এইবার টাকা দেন… এত চিন্তা করলে ব্যবসা চলে?";
const REMOVED = "এইটা বাদ দিলেন ক্যান? আপনার রুচি নিয়ে সন্দেহ হইতেছে।";
const HIGH = "ভাই… জিনিস ভালো লাগছে বুঝলাম, কিন্তু এতগুলা?";
const LOW = "এই টাকায় তো ঠিকমতো নাশতাও হয় না!";

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const isSecretCart = items.some((item) => item.product.is_hidden === true);
  const { dialogue, say } = useDialogue({ line: EMPTY[0] ?? "", expression: "hmm" });
  const tick = useRef(0);
  const prevCount = useRef(totalItems);

  useEffect(() => {
    if (totalItems < prevCount.current) say(REMOVED, "hmm", true);
    prevCount.current = totalItems;
  }, [totalItems, say]);

  useEffect(() => {
    if (!isOpen) return;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const index = tick.current++;
      const line = totalItems === 0 ? EMPTY[index % EMPTY.length] ?? ""
        : totalPrice >= 50 ? HIGH
        : totalItems === 1 ? totalPrice < 18 && index % 3 === 2 ? LOW : ONE[index % ONE.length] ?? ""
        : TWO;
      say(line);
      timer = setTimeout(cycle, dialogueReadingTime(line));
    };
    cycle();
    return () => clearTimeout(timer);
  }, [isOpen, totalItems, totalPrice, say]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="cart-sheet">
        <img
          className="cart-comedy-sticker"
          src={fierceCharacter.url}
          alt="A fierce bearded sticker character judging your cart"
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
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-image"><ProductImage id={item.product.id} name={item.product.name} /></div>
                  <div className="cart-item-main">
                    <span className="cart-item-name">{item.product.name}</span>
                    <span className="cart-item-price">{formatPrice(item.product.price)}</span>
                  </div>
                  <div className="cart-item-actions">
                    <Button type="button" variant="ghost" size="icon" className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease quantity">
                      <Minus size={14} />
                    </Button>
                    <span className="qty-value">{item.quantity}</span>
                    <Button type="button" variant="ghost" size="icon" className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase quantity">
                      <Plus size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="cart-remove" onClick={() => removeItem(item.product.id)} aria-label="Remove item">
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
              <Button asChild className="add-cart button-spring w-full" onMouseEnter={() => say(ALMOST)} onFocus={() => say(ALMOST)}>
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
