import blobLamp from "@/assets/product-blob-lamp.jpg";
import corkTray from "@/assets/product-cork-tray.jpg";
import littleGuyHook from "@/assets/product-little-guy-hook.jpg";
import stackRings from "@/assets/product-stack-rings.jpg";
import sunCoasters from "@/assets/product-sun-coasters.jpg";
import squiggleBookend from "@/assets/product-squiggle-bookend.jpg";
import prankExcuseButton from "@/assets/prank-excuse-button.jpg";
import prankSpillCoaster from "@/assets/prank-spill-coaster.jpg";
import prankDeskWhistle from "@/assets/prank-desk-whistle.jpg";

const PRODUCT_IMAGES: Record<string, string> = {
  "product-blob-lamp": blobLamp,
  "product-cork-tray": corkTray,
  "product-little-guy-hook": littleGuyHook,
  "product-stack-rings": stackRings,
  "product-sun-coasters": sunCoasters,
  "product-squiggle-bookend": squiggleBookend,
  "prank-excuse-button": prankExcuseButton,
  "prank-spill-coaster": prankSpillCoaster,
  "prank-desk-whistle": prankDeskWhistle,
};

export function ProductImage({ name, eager = false, src: custom }: { id: number; name: string; eager?: boolean; src?: string | null }) {
  const src = custom?.startsWith("http") ? custom : custom ? PRODUCT_IMAGES[custom] : undefined;
  if (!src) return null;

  return (
    <img
      className="product-image"
      src={src}
      alt={`${name} in the SMOL STUUF studio`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={1024}
      height={1024}
    />
  );
}