export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_PHOTOS_PER_UPLOAD = 20
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function validatePortfolioFiles(
  files: Pick<File, "name" | "size" | "type">[],
): string | null {
  if (!files.length) return "Nenhuma foto selecionada."
  if (files.length > MAX_PHOTOS_PER_UPLOAD) return "Envie até 20 fotos por vez."
  for (const file of files) {
    if (!PHOTO_TYPES.includes(file.type)) return `${file.name}: envie uma imagem JPG, PNG ou WebP.`
    if (!file.size) return `${file.name}: o arquivo está vazio.`
    if (file.size > MAX_PHOTO_BYTES) return `${file.name}: a imagem precisa ter até 5 MB.`
  }
  return null
}
