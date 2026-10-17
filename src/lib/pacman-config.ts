import { z } from "zod";

export const pacmanConfigSchema = z.object({
  arrangement: z.enum(["row", "compact", "staggered"]).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  icons: z.array(z.object({
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    size: z.number().min(16).max(40).optional(),
    rotation: z.number().min(-180).max(180).optional(),
    flip: z.boolean().optional(),
    delay: z.number().min(0).max(1).optional(),
  })).min(1).max(4).optional(),
});
export type PacmanConfig = z.infer<typeof pacmanConfigSchema>;