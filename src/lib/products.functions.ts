import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./supabase-public";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
  if (error) throw error;
  return { products: data ?? [] };
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string | number }) => data)
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", Number(data.id))
      .single();
    if (error) throw error;
    return { product };
  });
