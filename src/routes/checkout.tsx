import { assetUrl } from "@/lib/asset-url";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { formatPrice } from "@/data/products";
import { useCart, itemKey, unitPrice } from "@/hooks/use-cart";
import { CHECKOUT_IDLE, CHECKOUT_IDLE_HIGH, CHECKOUT_IDLE_ONE } from "@/data/dialogue-defaults";
import { useDialogue } from "@/hooks/use-dialogue";
import { CheckoutSpeaker } from "@/components/smol/CheckoutSpeaker";
import { CouponPanel } from "@/components/smol/CouponPanel";
import { createOrder, previewCoupon } from "@/lib/orders.functions";
import { useCustomer } from "@/hooks/use-customer";
import logo from "@/assets/smol-stuuf-logo.png.asset.json";

const checkoutSchema = z.object({
  shipping_name: z.string().min(2, "Name is required"),
  shipping_email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  shipping_phone: z.string().min(8, "Phone number is required"),
  shipping_address: z.string().min(5, "Address is required"),
  shipping_city: z.string().min(2, "City is required"),
  shipping_notes: z.string().optional(),
  payment_method: z.enum(["cod", "bkash"]),
  bkash_transaction_id: z.string().optional(),
}).superRefine((values, context) => {
  if (values.payment_method === "bkash" && !values.bkash_transaction_id?.trim()) {
    context.addIssue({ code: "custom", path: ["bkash_transaction_id"], message: "Transaction ID is required" });
  }
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — SMOL STUUF" },
      { name: "description", content: "Complete your SMOL STUUF order." },
      { property: "og:title", content: "Checkout — SMOL STUUF" },
      { property: "og:description", content: "Complete your SMOL STUUF order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, totalPrice } = useCart();
  const isSecretOrder = items.some((item) => item.product.is_hidden === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customer = useCustomer();
  const [couponPanelOpen, setCouponPanelOpen] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number; total: number } | null>(null);
  // A changed cart invalidates the previewed discount.
  useEffect(() => setCoupon(null), [totalPrice, items.length]);
  const payable = coupon ? coupon.total : totalPrice;

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (!code.trim()) return false;
    setCouponBusy(true);
    try {
      const result = await previewCoupon({
        data: {
          code,
          items: items.map((i) => ({ product_id: i.product.id, ...(i.variation?.id ? { variation_id: i.variation.id } : {}), quantity: i.quantity })),
        },
      });
      setCoupon({ code: result.code, discount: result.discount, total: result.total });
      toast.success(`Coupon ${result.code} applied`);
      return true;
    } catch (error) {
      setCoupon(null);
      toast.error(error instanceof Error ? error.message : "Could not apply coupon");
      return false;
    } finally {
      setCouponBusy(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: isSecretOrder ? "bkash" : "cod", shipping_email: "" },
  });

  const paymentMethod = watch("payment_method");

  useEffect(() => {
    if (isSecretOrder) setValue("payment_method", "bkash");
  }, [isSecretOrder, setValue]);

  const { dialogue, say, saySequence, configuredSequence, linesFor } = useDialogue({ line: "এইবার আর পেছনে তাকাইয়েন না।", expression: "shush" });
  const idle = useRef<number | undefined>(undefined);
  const idleIndex = useRef(0);
  const poke = useCallback(() => {
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      const lines = totalPrice >= 50 ? linesFor("checkout-idle-high", CHECKOUT_IDLE_HIGH)
        : items.length === 1 ? linesFor("checkout-idle-one", CHECKOUT_IDLE_ONE) : linesFor("checkout-idle", CHECKOUT_IDLE);
      const pick = lines[idleIndex.current++ % lines.length];
      if (pick) saySequence([pick], 0);
      poke();
    }, 15000);
  }, [totalPrice, items.length, linesFor, saySequence]);
  useEffect(() => {
    poke();
    return () => window.clearTimeout(idle.current);
  }, [poke]);
  const prevPay = useRef(paymentMethod);
  useEffect(() => {
    if (prevPay.current === paymentMethod) return;
    if (paymentMethod === "bkash") configuredSequence("checkout-payment", [{ line: "ওহ! আগেই মিটায় ফেললেন?", expression: "shocked" }, { line: "বাহ, বিশ্বাস আছে দেখতেছি!", expression: "laugh" }]);
    else configuredSequence("checkout-payment-cod", [{ line: "আগে দিতে চাইলেন, এখন আবার পরে?", expression: "hmm" }, { line: "সিদ্ধান্তটা একটু নড়বড়ে মনে হইতেছে।", expression: "unimpressed" }]);
    prevPay.current = paymentMethod;
  }, [paymentMethod, say, configuredSequence]);

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="wrap checkout-empty">
          <h1>Kuch to kharid le bawa re bawa !!!</h1>
          <p>Your basta is empty — add some stuuf before checking out.</p>
          <Link to="/shop" className="btn-primary">
            Shop the drop
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const onSubmit = async (values: CheckoutForm) => {
    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        variation_id: item.variation?.id,
        quantity: item.quantity,
        unit_price: unitPrice(item),
      }));

      const { orderId } = await createOrder({
        data: {
          order: {
            ...values,
            total_amount: payable,
            ...(coupon ? { coupon_code: coupon.code } : {}),
            order_source: isSecretOrder ? "secret" : "regular",
          },
          items: orderItems,
        },
      });

      window.localStorage.setItem("smol-cart", "[]");
      window.location.assign(`/order/${orderId}?phone=${encodeURIComponent(values.shipping_phone)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not place order";
      toast.error(message);
      say(message, "facepalm", 2);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader secret={isSecretOrder} />
      <main className="checkout-view">
        <div className="checkout-confetti" aria-hidden="true">
          <span>★</span><span>SMOL</span><span>✦</span><span>GOOD STUUF</span>
        </div>
        <div className="wrap checkout-wrap">
        <header className="checkout-heading-sticker">
          <div>
            <span className="checkout-kicker">Almost yours!</span>
            <h1 className="checkout-title">SMOL STUUF / CHECKOUT</h1>
          </div>
          <img src={assetUrl(logo)} alt="" className="checkout-floating-logo" width={320} height={224} />
        </header>
        <div className="checkout-layout">
          <form onSubmit={handleSubmit(onSubmit, () => configuredSequence("checkout-error", [{ line: "ভাই, কিছু তথ্য তো লাগবো।", expression: "nervous" }, { line: "নাম-ঠিকানা ছাড়া জিনিস পাঠামু কই?", expression: "facepalm" }], 2))} className="checkout-form" onInput={poke} onClick={poke}>
            <section className="checkout-section">
              <h2><span>Shipping deets</span></h2>
              <div className="form-grid">
                <div className="form-field">
                  <Label className="field-sticker sticker-red" htmlFor="shipping_name">নামটা দেন</Label>
                  <Input id="shipping_name" placeholder="Who gets the stuuf?" {...register("shipping_name", { onBlur: (e) => { if (e.target.value.trim().length >= 2) say("নামটা সুন্দর হইছে।", "laugh"); } })} />
                  {errors.shipping_name && <span className="form-error">{errors.shipping_name.message}</span>}
                </div>
                <div className="form-field">
                  <Label className="field-sticker sticker-yellow" htmlFor="shipping_email">ইমেইল</Label>
                  <Input id="shipping_email" type="email" placeholder="ইমেইল থাকলে দেন, না থাকলেও জীবন থেমে থাকবে না" {...register("shipping_email")} />
                  {errors.shipping_email && <span className="form-error">{errors.shipping_email.message}</span>}
                </div>
                <div className="form-field">
                  <Label className="field-sticker sticker-cyan" htmlFor="shipping_phone">যে নাম্বারে ফোন ধরবেন</Label>
                  <Input id="shipping_phone" placeholder="01XXXXXXXXX" {...register("shipping_phone", { onBlur: (e) => { if (e.target.value.trim().length >= 8) say("এই নাম্বারেই ধরবেন কিন্তু।", "phone"); } })} />
                  {errors.shipping_phone && <span className="form-error">{errors.shipping_phone.message}</span>}
                </div>
                <div className="form-field">
                  <Label className="field-sticker sticker-pink" htmlFor="shipping_city">শহরের নাম দেন</Label>
                  <Input id="shipping_city" placeholder="Dhaka? Chattogram?" {...register("shipping_city")} />
                  {errors.shipping_city && <span className="form-error">{errors.shipping_city.message}</span>}
                </div>
                <div className="form-field full">
                  <Label className="field-sticker sticker-yellow" htmlFor="shipping_address">কোথায় পাঠামু?</Label>
                  <Textarea id="shipping_address" rows={3} placeholder="বাড়ি, রাস্তা, এলাকা — পুরা কাহিনী" {...register("shipping_address", { onBlur: (e) => { if (e.target.value.trim().length >= 5) say("এইবার বুঝলাম কই পাঠামু।", "praying"); } })} />
                  {errors.shipping_address && <span className="form-error">{errors.shipping_address.message}</span>}
                </div>
                <div className="form-field full">
                  <Label className="field-sticker sticker-cyan" htmlFor="shipping_notes">Secret note · optional</Label>
                  <Textarea id="shipping_notes" rows={2} placeholder="Gate color, landmark, tiny request..." {...register("shipping_notes")} />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <h2><span>How are we paying?</span></h2>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="payment-options"
                  >
                     <div className={`payment-option${isSecretOrder ? " payment-disabled" : ""}`}>
                       <RadioGroupItem value="cod" id="cod" disabled={isSecretOrder} />
                       <Label htmlFor="cod">Cash on delivery ( I don't trust you !!!) <small>Pehle Mal fir paiso ka dhamal</small></Label>
                    </div>
                    <div className="payment-option">
                      <RadioGroupItem value="bkash" id="bkash" />
                        <Label htmlFor="bkash">Bkash transfer ( Paise to hanto ka mail Hain) <small>01600053340 (personal-send money) · send it, then add the ID</small></Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.payment_method && <span className="form-error">{errors.payment_method.message}</span>}
              {isSecretOrder && <p className="advance-note">Secret stuuf requires advance payment. Your order stays pending until the transfer is checked.</p>}

              {paymentMethod === "bkash" && (
                <div className="form-field bkash-field">
                   <Label className="field-sticker sticker-pink" htmlFor="bkash_transaction_id">bKash transaction ID</Label>
                  <Input id="bkash_transaction_id" {...register("bkash_transaction_id")} />
                  {errors.bkash_transaction_id && (
                    <span className="form-error">{errors.bkash_transaction_id.message}</span>
                  )}
                </div>
              )}
            </section>

            <Button type="submit" disabled={isSubmitting} className="add-cart button-spring checkout-submit">
              {isSubmitting ? "Submitting order..." : `${isSecretOrder ? "Submit for verification" : "Place order"} · ${formatPrice(payable)}`}
            </Button>
          </form>

          <aside className="checkout-summary">
            <span className="summary-tape" aria-hidden="true" />
            <div className="summary-stamp">YOUR BASTA</div>
            <h2>একবার হিসাবটা দেখি</h2>
            <p className="summary-note">জিনিস: {items.reduce((n, i) => n + i.quantity, 0)}টা</p>
            <div className="summary-items">
              {items.map((item) => (
                <div key={itemKey(item)} className="summary-item">
                  <span>
                    {item.product.name}{item.variation ? ` · ${item.variation.name}` : ""} × {item.quantity}
                  </span>
                  <span>{formatPrice(unitPrice(item) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-coupon">
              {!customer ? (
                <p className="summary-note"><Link to="/auth">Sign in</Link> to use a coupon.</p>
              ) : coupon ? (
                <div className="coupon-applied">
                  <div className="coupon-applied-head">
                    <span className="coupon-tag">{coupon.code}</span>
                    <button type="button" className="coupon-remove" onClick={() => setCoupon(null)}>Remove</button>
                  </div>
                  <p className="summary-note">Coupon applied — you saved {formatPrice(coupon.discount)}.</p>
                </div>
              ) : (
                <button type="button" className="coupon-open" onClick={() => setCouponPanelOpen(true)}>
                  <span aria-hidden="true">🎟</span> Have a coupon? <b>Apply</b>
                </button>
              )}
              {customer && <CouponPanel open={couponPanelOpen} onOpenChange={setCouponPanelOpen} subtotal={totalPrice} busy={couponBusy} appliedCode={coupon?.code ?? null} onApply={applyCoupon} />}
            </div>
            {coupon && (
              <>
                <div className="summary-item"><span>Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
                <div className="summary-item summary-discount"><span>Discount ({coupon.code})</span><span>−{formatPrice(coupon.discount)}</span></div>
              </>
            )}
            <div className="summary-total">
              <span>Total</span>
              <span>{formatPrice(payable)}</span>
            </div>
            <p className="summary-note">Shipping calculated after order confirmation.</p>
            <div className="summary-badge" lang="bn">এই হিসাব ঠিকঠাক তো?</div>
          </aside>
        </div>
        </div>
      </main>
      <CheckoutSpeaker dialogue={dialogue} />
      <SiteFooter />
    </>
  );
}
