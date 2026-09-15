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
  created_at?: string;
  updated_at?: string;
};

export function formatPrice(price: number) {
  return `$${price.toFixed(0)}`;
}
