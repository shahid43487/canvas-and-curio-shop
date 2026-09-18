import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./supabase-public";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select("*").eq("is_hidden", false).order("id", { ascending: true });
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
      .eq("is_hidden", false)
      .single();
    if (error) throw error;
    return { product };
  });

export const listSecretProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { access: string }) => data)
  .handler(async ({ data }) => {
    if (data.access !== "open") throw new Error("Secret door is closed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_hidden", true)
      .order("id", { ascending: true });
    if (error) throw error;
    return { products: products ?? [] };
  });

export const getSecretProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; access: string }) => data)
  .handler(async ({ data }) => {
    if (data.access !== "open") throw new Error("Secret door is closed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", Number(data.id))
      .eq("is_hidden", true)
      .single();
    if (error) throw error;
    return { product };
  });
