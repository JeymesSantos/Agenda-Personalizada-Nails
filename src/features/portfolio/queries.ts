import "server-only"

import { prisma } from "@/lib/prisma"

export async function listAlbums(businessId: string) {
  return prisma.album.findMany({
    where: { businessId },
    include: { _count: { select: { photos: true } } },
    orderBy: { order: "asc" },
  })
}

export async function listPhotos(businessId: string, albumId?: string) {
  return prisma.photo.findMany({
    where: { businessId, ...(albumId ? { albumId } : {}) },
    include: { album: { select: { name: true } }, service: { select: { title: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

export async function getPhoto(businessId: string, id: string) {
  return prisma.photo.findFirst({ where: { id, businessId } })
}

export async function countPhotos(businessId: string) {
  return prisma.photo.count({ where: { businessId } })
}
