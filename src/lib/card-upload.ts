import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export const uploadLimits = { background: 5 * 1024 * 1024, sound: 5 * 1024 * 1024, svg: 512 * 1024 } as const;
export function sanitizeCardSvg(source: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error("SVG declarations are not supported");
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  if (!root || root.localName !== "svg") throw new Error("Invalid SVG");
  const tags = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "linearGradient", "radialGradient", "stop", "clipPath"]);
  const attributes = new Set(["xmlns", "viewBox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "transform", "id", "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "font-size", "font-weight", "text-anchor", "clip-path", "fill-rule"]);
  const clean = (element: typeof root) => {
    for (const attr of Array.from(element.attributes)) {
      if (!attributes.has(attr.name) || /javascript:|data:|https?:|\/\/|[<>]/i.test(attr.value) || (/url\(/i.test(attr.value) && !/^url\(#[\w-]+\)$/.test(attr.value))) element.removeAttribute(attr.name);
    }
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 1) {
        const node = child as typeof root;
        if (!tags.has(node.tagName)) element.removeChild(node); else clean(node);
      } else if (child.nodeType !== 3) element.removeChild(child);
    }
  };
  clean(root);
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(root);
}