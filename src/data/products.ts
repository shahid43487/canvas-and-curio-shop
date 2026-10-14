export type Product = {
  id: number;
  num: string;
  name: string;
  price: number;
  color: string;
  tag: string;
  material: string;
  dims: string;
  batch: string;
  description: string;
  colors: string[];
  stock: number;
  image_key: string;
  is_hidden?: boolean;
  selector_mode?: string;
  requires_advance_payment?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function formatPrice(price: number) {
  return `$${price.toFixed(0)}`;
}

export type PacIcon = { color: string; size?: number; rotation?: number; flip?: boolean; delay?: number };
export type Variation = {
  id: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  bundle_quantity: number;
  image_key: string | null;
  button_config: { arrangement?: "row" | "compact" | "staggered"; icons?: PacIcon[]; color?: string };
};
