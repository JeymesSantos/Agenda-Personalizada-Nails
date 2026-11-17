import { z } from "zod"

export const mediaFrameSchema = z
  .object({
    x: z.number().int().min(0).max(100),
    y: z.number().int().min(0).max(100),
    zoom: z.number().min(1).max(3).default(1),
    fit: z.enum(["cover", "contain"]).default("cover"),
  })
  .refine(
    (frame) => frame.fit !== "contain" || frame.zoom === 1,
    "A imagem inteira deve usar zoom de 100%",
  )

export const responsiveFramesSchema = z.object({
  mobile: mediaFrameSchema,
  desktop: mediaFrameSchema,
})
export const photoFocusSchema = z
  .object({
    x: z.number().int().min(0).max(100),
    y: z.number().int().min(0).max(100),
    zoom: z.number().min(1).max(3).default(1),
    fit: z.enum(["cover", "contain"]).default("cover"),
    desktop: mediaFrameSchema.optional(),
  })
  .refine(
    (frame) => frame.fit !== "contain" || frame.zoom === 1,
    "A imagem inteira deve usar zoom de 100%",
  )
