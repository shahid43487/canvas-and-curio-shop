import blobLamp from "@/assets/product-blob-lamp.jpg";
import corkTray from "@/assets/product-cork-tray.jpg";
import littleGuyHook from "@/assets/product-little-guy-hook.jpg";
import stackRings from "@/assets/product-stack-rings.jpg";
import sunCoasters from "@/assets/product-sun-coasters.jpg";
import squiggleBookend from "@/assets/product-squiggle-bookend.jpg";

const PRODUCT_IMAGES: Record<number, string> = {
  1: blobLamp,
  2: corkTray,
  3: littleGuyHook,
  4: stackRings,
  5: sunCoasters,
  6: squiggleBookend,
};

export function ProductImage({ id, name, eager = false }: { id: number; name: string; eager?: boolean }) {
  const src = PRODUCT_IMAGES[id];
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