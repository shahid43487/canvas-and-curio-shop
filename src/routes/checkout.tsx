import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { useCart } from "@/hooks/use-cart";
import { createOrder } from "@/lib/orders.functions";

const checkoutSchema = z.object({
  shipping_name: z.string().min(2, "Name is required"),
  shipping_email: z.string().email("Valid email required"),
  shipping_phone: z.string().min(8, "Phone number is required"),
  shipping_address: z.string().min(5, "Address is required"),
  shipping_city: z.string().min(2, "City is required"),
  shipping_notes: z.string().optional(),
  payment_method: z.enum(["cod", "bkash"]),
  bkash_transaction_id: z.string().optional(),
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
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: "cod" },
  });

  const paymentMethod = watch("payment_method");

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="wrap checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add some stuuf before checking out.</p>
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
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { orderId } = await createOrder({
        data: {
          order: {
            ...values,
            total_amount: totalPrice,
          },
          items: orderItems,
        },
      });

      clearCart();
      navigate({
        to: "/order/$id",
        params: { id: orderId },
        search: { phone: values.shipping_phone },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not place order";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap checkout-view">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-layout">
          <form onSubmit={handleSubmit(onSubmit)} className="checkout-form">
            <section className="checkout-section">
              <h2>Shipping details</h2>
              <div className="form-grid">
                <div className="form-field">
                  <Label htmlFor="shipping_name">Full name</Label>
                  <Input id="shipping_name" {...register("shipping_name")} />
                  {errors.shipping_name && <span className="form-error">{errors.shipping_name.message}</span>}
                </div>
                <div className="form-field">
                  <Label htmlFor="shipping_email">Email</Label>
                  <Input id="shipping_email" type="email" {...register("shipping_email")} />
                  {errors.shipping_email && <span className="form-error">{errors.shipping_email.message}</span>}
                </div>
                <div className="form-field">
                  <Label htmlFor="shipping_phone">Phone</Label>
                  <Input id="shipping_phone" {...register("shipping_phone")} />
                  {errors.shipping_phone && <span className="form-error">{errors.shipping_phone.message}</span>}
                </div>
                <div className="form-field">
                  <Label htmlFor="shipping_city">City</Label>
                  <Input id="shipping_city" {...register("shipping_city")} />
                  {errors.shipping_city && <span className="form-error">{errors.shipping_city.message}</span>}
                </div>
                <div className="form-field full">
                  <Label htmlFor="shipping_address">Address</Label>
                  <Textarea id="shipping_address" rows={3} {...register("shipping_address")} />
                  {errors.shipping_address && <span className="form-error">{errors.shipping_address.message}</span>}
                </div>
                <div className="form-field full">
                  <Label htmlFor="shipping_notes">Order notes (optional)</Label>
                  <Textarea id="shipping_notes" rows={2} {...register("shipping_notes")} />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <h2>Payment method</h2>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="payment-options"
                  >
                    <div className="payment-option">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Cash on delivery</Label>
                    </div>
                    <div className="payment-option">
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash">bKash transfer</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.payment_method && <span className="form-error">{errors.payment_method.message}</span>}

              {paymentMethod === "bkash" && (
                <div className="form-field bkash-field">
                  <Label htmlFor="bkash_transaction_id">bKash transaction ID</Label>
                  <Input id="bkash_transaction_id" {...register("bkash_transaction_id")} />
                  {errors.bkash_transaction_id && (
                    <span className="form-error">{errors.bkash_transaction_id.message}</span>
                  )}
                </div>
              )}
            </section>

            <Button type="submit" disabled={isSubmitting} className="add-cart button-spring checkout-submit">
              {isSubmitting ? "Placing order..." : `Place order · ${formatPrice(totalPrice)}`}
            </Button>
          </form>

          <aside className="checkout-summary">
            <h2>Order summary</h2>
            <div className="summary-items">
              {items.map((item) => (
                <div key={item.product.id} className="summary-item">
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <p className="summary-note">Shipping calculated after order confirmation.</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
