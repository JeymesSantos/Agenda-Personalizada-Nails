import { expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: { findMany: vi.fn() },
  },
}))

import { prisma } from "@/lib/prisma"
import { listClients } from "./queries"

it("mostra uma conta nova sem agendamento com indicadores zerados", async () => {
  vi.mocked(prisma.user.findMany).mockResolvedValue([
    { id: "nova", name: "Ana", passwordHash: "hash", createdAt: new Date() },
  ] as never)
  const rows = await listClients("studio")
  expect(rows[0]).toMatchObject({
    id: "nova",
    registered: true,
    visits: 0,
    spentCents: 0,
    nextAt: null,
  })
  expect(prisma.user.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        role: "CLIENT",
        AND: [
          {
            OR: [
              { passwordHash: { not: null } },
              { appointments: { some: { businessId: "studio" } } },
            ],
          },
        ],
      }),
    }),
  )
})
