import blobLamp from "@/assets/product-blob-lamp.jpg";
import blobLampB from "@/assets/product-blob-lamp-b.jpg";
import blobLampC from "@/assets/product-blob-lamp-c.jpg";
import corkTray from "@/assets/product-cork-tray.jpg";
import corkTrayB from "@/assets/product-cork-tray-b.jpg";
import corkTrayC from "@/assets/product-cork-tray-c.jpg";
import littleGuyHook from "@/assets/product-little-guy-hook.jpg";
import littleGuyHookB from "@/assets/product-little-guy-hook-b.jpg";
import littleGuyHookC from "@/assets/product-little-guy-hook-c.jpg";
import stackRings from "@/assets/product-stack-rings.jpg";
import stackRingsB from "@/assets/product-stack-rings-b.jpg";
import stackRingsC from "@/assets/product-stack-rings-c.jpg";
import sunCoasters from "@/assets/product-sun-coasters.jpg";
import sunCoastersB from "@/assets/product-sun-coasters-b.jpg";
import sunCoastersC from "@/assets/product-sun-coasters-c.jpg";
import squiggleBookend from "@/assets/product-squiggle-bookend.jpg";
import squiggleBookendB from "@/assets/product-squiggle-bookend-b.jpg";
import squiggleBookendC from "@/assets/product-squiggle-bookend-c.jpg";

/** One image per colorway, in the same order as product.colors. */
export const PRODUCT_IMAGES: Record<number, string[]> = {
  1: [blobLamp, blobLampB, blobLampC],
  2: [corkTray, corkTrayB, corkTrayC],
  3: [littleGuyHook, littleGuyHookB, littleGuyHookC],
  4: [stackRings, stackRingsB, stackRingsC],
  5: [sunCoasters, sunCoastersB, sunCoastersC],
  6: [squiggleBookend, squiggleBookendB, squiggleBookendC],
};

export function productImageSrc(id: number, variant = 0): string | undefined {
  const set = PRODUCT_IMAGES[id];
  if (!set || set.length === 0) return undefined;
  return set[variant % set.length] ?? set[0];
}

export function ProductImage({
  id,
  name,
  eager = false,
  variant = 0,
  className,
}: {
  id: number;
  name: string;
  eager?: boolean;
  variant?: number;
  className?: string;
}) {
  const src = productImageSrc(id, variant);
  if (!src) return null;

  return (
    <img
      key={src}
      className={className ? `product-image ${className}` : "product-image"}
      src={src}
      alt={`${name} in the SMOL STUUF studio`}
      loading={eager ? "eager" : "lazy"}
      width={768}
      height={768}
    />
  );
}
