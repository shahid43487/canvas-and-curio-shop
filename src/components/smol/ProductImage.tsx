import blobLamp from "@/assets/product-blob-lamp.jpg";
import corkTray from "@/assets/product-cork-tray.jpg";
import littleGuyHook from "@/assets/product-little-guy-hook.jpg";
import stackRings from "@/assets/product-stack-rings.jpg";
import sunCoasters from "@/assets/product-sun-coasters.jpg";
import squiggleBookend from "@/assets/product-squiggle-bookend.jpg";
import prankExcuseButton from "@/assets/prank-excuse-button.jpg";
import prankSpillCoaster from "@/assets/prank-spill-coaster.jpg";
import prankDeskWhistle from "@/assets/prank-desk-whistle.jpg";

const PRODUCT_IMAGES: Record<number, string> = {
  1: blobLamp,
  2: corkTray,
  3: littleGuyHook,
  4: stackRings,
  5: sunCoasters,
  6: squiggleBookend,
  101: prankExcuseButton,
  102: prankSpillCoaster,
  103: prankDeskWhistle,
};

export function ProductImage({ id, name, eager = false, src: custom }: { id: number; name: string; eager?: boolean; src?: string | null }) {
  const src = custom?.startsWith("http") ? custom : PRODUCT_IMAGES[id];
  if (!src) return null;

  return (
    <img
      className="product-image"
      src={src}
      alt={`${name} in the SMOL STUUF studio`}
      loading={eager ? "eager" : "lazy"}
      width={1024}
      height={1024}
    />
  );
}