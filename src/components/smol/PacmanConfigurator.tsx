import { Button } from "@/components/ui/button";
import { VariationSelector } from "./VariationSelector";
import type { PacmanConfig } from "@/lib/pacman-config";

export function PacmanConfigurator({ value, onChange, name }: { value: PacmanConfig; onChange: (v: PacmanConfig) => void; name: string }) {
  const icons = value.icons?.length ? value.icons : [{ color: "#FFD23F", size: 22, rotation: 0, flip: false }];
  return <fieldset className="pac-config"><legend>Pac-Man sticker</legend>
    <div className="admin-row">
      <label>Count <input aria-label="Pac-Man count" type="range" min={1} max={4} value={icons.length} onChange={e => onChange({ ...value, icons: Array.from({ length: Number(e.target.value) }, (_, i) => icons[i] ?? icons[0] ?? { color: "#FFD23F" }) })} /> {icons.length}</label>
      <label>Arrangement <select className="admin-input" value={value.arrangement ?? "row"} onChange={e => onChange({ ...value, arrangement: e.target.value as PacmanConfig["arrangement"] })}><option value="row">Row</option><option value="compact">Overlapping</option><option value="staggered">Scattered</option></select></label>
    </div>
    {icons.map((icon, i) => <div className="admin-row" key={i}>
      <label>Colour {i + 1} <input aria-label={`Pac-Man colour ${i + 1}`} type="color" value={icon.color} onChange={e => onChange({ ...value, icons: icons.map((x, n) => n === i ? { ...x, color: e.target.value } : x) })} /></label>
      <label>Rotation <input aria-label={`Pac-Man rotation ${i + 1}`} type="range" min={-180} max={180} value={icon.rotation ?? 0} onChange={e => onChange({ ...value, icons: icons.map((x, n) => n === i ? { ...x, rotation: Number(e.target.value) } : x) })} /></label>
      <label>Size <input aria-label={`Pac-Man size ${i + 1}`} type="range" min={16} max={40} value={icon.size ?? 22} onChange={e => onChange({ ...value, icons: icons.map((x, n) => n === i ? { ...x, size: Number(e.target.value) } : x) })} /></label>
      <Button type="button" variant="outline" aria-pressed={icon.flip ?? false} onClick={() => onChange({ ...value, icons: icons.map((x, n) => n === i ? { ...x, flip: !x.flip } : x) })}>Flip</Button>
    </div>)}
    <VariationSelector mode="pacman" selectedId="preview" onSelect={() => {}} variations={[{ id: "preview", name: name || "Option", sku: "", price: 0, stock: 1, compare_at_price: null, bundle_quantity: 1, image_key: null, button_config: { ...value, icons } }]} />
  </fieldset>;
}