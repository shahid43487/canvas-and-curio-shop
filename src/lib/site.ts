import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SLIDES, type Slide } from "@/data/drops";
import { adminFileUrl, adminUploadUrl } from "./admin.functions";
import { getSiteSettings } from "./site.functions";

export type Socials = { instagram: string; facebook: string; tiktok: string; youtube: string; email: string };
export type CustomSound = { id: string; name: string; url: string; trigger: "click" | "cart" | "chomp" | "none" };
export type SoundSettings = {
  enabled: boolean; volume: number; click: boolean; cart: boolean; chomp: boolean;
  music: { url: string; name: string; enabled: boolean; loop: boolean; volume: number };
  library: CustomSound[];
};
export type CustomSticker = { id: string; label: string; src: string };
export type StickerSettings = { custom: CustomSticker[]; hidden: string[] };

export const DEFAULT_SOCIALS: Socials = { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "", email: "" };
export const DEFAULT_SOUND: SoundSettings = {
  enabled: true, volume: 0.4, click: true, cart: true, chomp: true,
  music: { url: "", name: "", enabled: false, loop: true, volume: 0.3 },
  library: [],
};

export type Site = { slides: Slide[]; slideInterval: number; socials: Socials; sound: SoundSettings; stickers: StickerSettings };

export const siteQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: async (): Promise<Site> => {
    const raw = (await getSiteSettings()) as Partial<Record<keyof Site, unknown>>;
    return {
      slides: Array.isArray(raw.slides) ? (raw.slides as Slide[]) : SLIDES,
      slideInterval: typeof raw.slideInterval === "number" ? Math.max(2, Math.min(15, raw.slideInterval)) : 6,
      socials: { ...DEFAULT_SOCIALS, ...(raw.socials as Partial<Socials>) },
      sound: { ...DEFAULT_SOUND, ...(raw.sound as Partial<SoundSettings>), music: { ...DEFAULT_SOUND.music, ...((raw.sound as SoundSettings | undefined)?.music) } },
      stickers: { custom: [], hidden: [], ...(raw.stickers as Partial<StickerSettings>) },
    };
  },
  staleTime: 60_000,
});
export const useSite = () => useQuery(siteQuery).data;

/** Admin-only: upload a file to storage and return a long-lived URL. */
export async function uploadMedia(token: string, file: File) {
  const { path, token: upToken } = await adminUploadUrl({ data: { token, filename: file.name } });
  const { error } = await supabase.storage.from("media").uploadToSignedUrl(path, upToken, file, { contentType: file.type });
  if (error) throw error;
  return (await adminFileUrl({ data: { token, path } })).url;
}
