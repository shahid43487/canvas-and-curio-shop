import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./supabase-public";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient().from("site_settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string | number | boolean | object | null>;
});
