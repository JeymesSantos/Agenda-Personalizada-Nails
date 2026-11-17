import { z } from "zod"

export const mediaCropSchema = z
  .object({
    x: z.number().min(0).max(90),
    y: z.number().min(0).max(90),
    width: z.number().min(10).max(100),
    height: z.number().min(10).max(100),
  })
  .refine(
    (crop) => crop.x + crop.width <= 100 && crop.y + crop.height <= 100,
    "O recorte deve ficar dentro da imagem",
  )

export const mediaFrameSchema = z
  .object({
    x: z.number().int().min(0).max(100),
    y: z.number().int().min(0).max(100),
    zoom: z.number().min(0.25).max(3).default(1),
    fit: z.enum(["cover", "contain"]).default("cover"),
    crop: mediaCropSchema.optional(),
  })
  .refine(
    (frame) => frame.fit !== "contain" || frame.zoom <= 1,
    "Para mostrar a imagem inteira, use zoom de até 100%",
  )

export const responsiveFramesSchema = z.object({
  mobile: mediaFrameSchema,
  desktop: mediaFrameSchema,
})
export const photoFocusSchema = z
  .object({
    x: z.number().int().min(0).max(100),
    y: z.number().int().min(0).max(100),
    zoom: z.number().min(0.25).max(3).default(1),
    fit: z.enum(["cover", "contain"]).default("cover"),
    crop: mediaCropSchema.optional(),
    desktop: mediaFrameSchema.optional(),
  })
  .refine(
    (frame) => frame.fit !== "contain" || frame.zoom <= 1,
    "Para mostrar a imagem inteira, use zoom de até 100%",
  )
