import { useEffect, useState } from "react";
import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";

import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { formatPrice } from "@/data/products";
import { getOrder } from "@/lib/orders.functions";
import type { Product } from "@/data/products";

type OrderItemWithProduct = {
  id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  products: Product | null;
};

export const Route = createFileRoute("/order/$id")({
  validateSearch: (search: { phone?: string }) => search,
  head: ({ params }) => ({
    meta: [
      { title: "Order received — SMOL STUUF" },
      { name: "description", content: "Your SMOL STUUF order details." },
      { property: "og:title", content: "Order received — SMOL STUUF" },
      { property: "og:description", content: "Your SMOL STUUF order details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context, params, location }) =>
    context.queryClient.ensureQueryData(orderQueryOptions(params.id, (location.search as { phone?: string }).phone ?? "")),
  component: OrderConfirmation,
  errorComponent: OrderError,
});

function orderQueryOptions(id: string, phone: string) {
  return queryOptions({
    queryKey: ["order", id, phone],
    queryFn: () => getOrder({ data: { id, phone } }),
  });
}

const CHEERS = ["এইবার নিশ্চিন্ত।", "ভালো choice ভাই।", "দেখেন, পরে যেন কন না বলি নাই।", "অর্ডার হইছে। এখন অপেক্ষা করেন।", "ভাই, আমরাও খুশি! 😭"];

function OrderConfirmation() {
  const { id } = Route.useParams();
  const { phone } = Route.useSearch();
  const { data } = useSuspenseQuery(orderQueryOptions(id, phone ?? ""));
  const order = data.order;
  const items = (order.order_items ?? []) as unknown as OrderItemWithProduct[];
  const [cheer, setCheer] = useState(CHEERS[0]);
  useEffect(() => setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]), []);
  const awaitingPaymentCheck = order.payment_method === "bkash" && order.payment_status === "pending";

  return (
    <>
      <SiteHeader />
      <main className="wrap order-view">
        <div className="order-hero">
          <CircleCheck size={56} strokeWidth={2} />
          <h1>Hoise! 🎉</h1>
          <p lang="bn">আপনার জিনিসপত্র রওনা দেওয়ার প্রস্তুতি নিচ্ছে।</p>
          <span className="speech-bubble" lang="bn">{cheer}</span>
          <p>{awaitingPaymentCheck ? "We received your order and transaction ID. It stays pending until the bKash transfer is checked." : "Thanks for ordering some smol stuuf. We’ll be in touch soon."}</p>
        </div>

        <div className="order-card">
          <div className="order-row">
            <span className="order-label">Order number</span>
            <span className="order-value">{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Payment status</span>
            <span className="order-value status">{order.payment_status}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Status</span>
            <span className="order-value status">{order.status}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Payment</span>
            <span className="order-value">
              {order.payment_method === "cod" ? "Cash on delivery" : "bKash transfer"}
            </span>
          </div>
        </div>

        <div className="order-card">
          <h2>Items</h2>
          {items.map((item) => (
            <div key={item.id} className="order-row item">
              <span>
                {item.products?.name ?? "Stuuf"} × {item.quantity}
              </span>
              <span>{formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          ))}
          {Number(order.discount_amount) > 0 && (
            <div className="order-row">
              <span>Coupon discount</span>
              <span>−{formatPrice(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="order-row total">
            <span>Total</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        <div className="order-card">
          <h2>Shipping to</h2>
          <p className="order-address">
            {order.shipping_name}
            <br />
            {order.shipping_address}
            <br />
            {order.shipping_city}
            <br />
            {order.shipping_phone}
            <br />
            {order.shipping_email}
          </p>
          {order.shipping_notes && <p className="order-notes">Notes: {order.shipping_notes}</p>}
        </div>

        <Link to="/shop" className="btn-primary order-back">
          Keep shopping
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

function OrderError({ error }: ErrorComponentProps) {
  return (
    <>
      <SiteHeader />
      <main className="wrap order-view">
        <div className="order-hero">
          <h1>Couldn&apos;t find that order</h1>
          <p>{(error as Error).message}</p>
          <Link to="/shop" className="btn-primary order-back">
            Back to shop
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
