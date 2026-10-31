/*
 * Seed com os dados que aparecem nas telas do Figma (Letícia Fagundes · Studio LF).
 * Agendamentos são gerados em torno da data atual para o dashboard e a agenda
 * terem conteúdo em qualquer dia em que o seed rodar. Determinístico (PRNG com semente).
 *
 * Rodar: pnpm db:seed (ou pnpm db:reset para recriar tudo)
 */
import "dotenv/config"
import { TZDate } from "@date-fns/tz"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { addDays, addMinutes, startOfDay, subDays } from "date-fns"

import { PrismaClient, type AppointmentStatus } from "../src/generated/prisma/client"

const TZ = "America/Sao_Paulo"
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/* PRNG determinístico (mulberry32) para o seed ser reproduzível. */
function rng(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
const random = rng(2026)
const pick = <T>(arr: T[]) => arr[Math.floor(random() * arr.length)]

/* Data local do estúdio → instante UTC. */
function local(y: number, m: number, d: number, h = 0, min = 0) {
  return new TZDate(y, m - 1, d, h, min, 0, TZ)
}
function atLocalTime(day: Date, minutesFromMidnight: number) {
  const z = new TZDate(day, TZ)
  const start = new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 0, 0, 0, TZ)
  return addMinutes(start, minutesFromMidnight)
}

async function main() {
  console.log("→ limpando dados")
  await prisma.reminder.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.clientNote.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.album.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.scheduleException.deleteMany()
  await prisma.workingHours.deleteMany()
  await prisma.service.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.business.deleteMany()
  await prisma.user.deleteMany()

  console.log("→ profissional e estúdio")
  const passwordHash = await bcrypt.hash("leticia123", 10)
  /* ids fixos: re-semear não invalida sessões abertas nem links salvos */
  const owner = await prisma.user.create({
    data: {
      id: "usr_leticia",
      name: "Letícia Fagundes",
      email: "leticia@minhaagenda.app",
      whatsapp: "11987654321",
      passwordHash,
      role: "ADMIN",
    },
  })

  const business = await prisma.business.create({
    data: {
      id: "biz_leticia",
      ownerId: owner.id,
      name: "Letícia Fagundes",
      slug: "leticia",
      tagline: "Nail designer · alongamento, blindagem e nail art com acabamento natural.",
      description:
        "Alongamento, blindagem e nail art com acabamento natural. Escolha o serviço, veja os horários livres em tempo real e confirme em menos de um minuto — com ou sem cadastro.",
      logoUrl: "/brand/logo-magenta.svg",
      instagram: "leticiafagundes.nails",
      whatsapp: "11987654321",
      addressLine: "Studio LF · Rua das Flores, 120",
      neighborhood: "Centro",
      hoursSummary: "Seg a Sáb · 9h–19h",
      statsAppointments: "+1.200",
      statsRating: "4,9",
      codePrefix: "LF",
      cancelMinHours: 24,
      slotStepMinutes: 15,
      timezone: TZ,
    },
  })

  console.log("→ categorias e serviços")
  const categoryNames = ["Alongamento", "Manutenção", "Esmaltação", "Nail art", "Blindagem"]
  const categories = Object.fromEntries(
    await Promise.all(
      categoryNames.map(async (name, order) => [
        name,
        await prisma.serviceCategory.create({ data: { businessId: business.id, name, order } }),
      ]),
    ),
  )

  const servicesData = [
    {
      title: "Alongamento em gel",
      category: "Alongamento",
      description: "Molde F1 com acabamento natural. Inclui cutilagem e esmaltação em gel.",
      durationMin: 120,
      bufferMin: 15,
      priceCents: 18000,
    },
    {
      title: "Manutenção",
      category: "Manutenção",
      description: "Reposição de gel, nivelamento e nova esmaltação. Até 21 dias.",
      durationMin: 60,
      bufferMin: 15,
      priceCents: 11000,
    },
    {
      title: "Blindagem",
      category: "Blindagem",
      description: "Camada de gel sobre a unha natural para fortalecer.",
      durationMin: 75,
      bufferMin: 10,
      priceCents: 9500,
    },
    {
      title: "Nail art",
      category: "Nail art",
      description: "Decoração exclusiva por unha: francesinha, glitter, pedrarias.",
      durationMin: 30,
      bufferMin: 5,
      priceCents: 1500,
      priceFrom: true,
    },
    {
      title: "Esmaltação em gel",
      category: "Esmaltação",
      description: "Esmaltação em gel sobre a unha natural, com cutilagem.",
      durationMin: 60,
      bufferMin: 10,
      priceCents: 8000,
    },
    {
      title: "Banho de gel",
      category: "Blindagem",
      description: "Camada fina de gel para dar resistência e brilho por até 3 semanas.",
      durationMin: 75,
      bufferMin: 10,
      priceCents: 12000,
    },
    {
      title: "Pedicure em gel",
      category: "Esmaltação",
      description: "Cutilagem, hidratação e esmaltação em gel nos pés.",
      durationMin: 60,
      bufferMin: 10,
      priceCents: 9000,
    },
    {
      title: "Remoção de gel",
      category: "Manutenção",
      description: "Remoção segura do gel com hidratação da unha natural.",
      durationMin: 30,
      bufferMin: 10,
      priceCents: 4000,
    },
  ]

  const services = await Promise.all(
    servicesData.map((s, order) =>
      prisma.service.create({
        data: {
          businessId: business.id,
          categoryId: categories[s.category].id,
          title: s.title,
          description: s.description,
          durationMin: s.durationMin,
          bufferMin: s.bufferMin,
          priceCents: s.priceCents,
          priceFrom: s.priceFrom ?? false,
          order,
          photoUrls: [`/placeholders/nail-${(order % 6) + 1}.svg`],
        },
      }),
    ),
  )
  const byTitle = (title: string) => services.find((s) => s.title === title)!

  console.log("→ horário de funcionamento e exceções")
  for (let weekday = 0; weekday <= 6; weekday++) {
    await prisma.workingHours.create({
      data: {
        businessId: business.id,
        weekday,
        enabled: weekday !== 0,
        startMin: 9 * 60,
        endMin: 19 * 60,
        breakStartMin: 12 * 60 + 30,
        breakEndMin: 13 * 60 + 45,
      },
    })
  }

  await prisma.scheduleException.createMany({
    data: [
      {
        businessId: business.id,
        type: "BLOCK",
        startsAt: local(2026, 11, 4, 15, 0),
        endsAt: local(2026, 11, 4, 19, 0),
        reason: "Curso de nail art",
      },
      {
        businessId: business.id,
        type: "BLOCK",
        startsAt: local(2026, 11, 20, 0, 0),
        endsAt: local(2026, 11, 21, 0, 0),
        allDay: true,
        reason: "Feriado — Consciência Negra",
      },
      {
        businessId: business.id,
        type: "BLOCK",
        startsAt: local(2026, 12, 24, 0, 0),
        endsAt: local(2027, 1, 1, 0, 0),
        allDay: true,
        reason: "Férias de fim de ano",
      },
      {
        businessId: business.id,
        type: "RELEASE",
        startsAt: local(2026, 11, 28, 15, 0),
        endsAt: local(2026, 11, 28, 18, 0),
        reason: "Horário extra liberado",
      },
    ],
  })

  console.log("→ clientes")
  const clientPassword = await bcrypt.hash("cliente123", 10)
  const clientsData = [
    {
      name: "Mariana Souza",
      email: "mariana@example.com",
      whatsapp: "11987654321".replace("11987654321", "11998765432"),
      registered: true,
    },
    {
      name: "Juliana Reis",
      email: "juliana@example.com",
      whatsapp: "11997654321",
      registered: true,
    },
    { name: "Camila Torres", whatsapp: "11996543210", registered: false },
    {
      name: "Ana Beatriz",
      email: "anabeatriz@example.com",
      whatsapp: "11995432109",
      registered: true,
    },
    { name: "Rita Oliveira", whatsapp: "11994321098", registered: false },
    { name: "Bia Lima", email: "bia@example.com", whatsapp: "11993210987", registered: true },
    { name: "Paula Nunes", whatsapp: "11992109876", registered: false },
    { name: "Gabi Ferreira", email: "gabi@example.com", whatsapp: "11991098765", registered: true },
    { name: "Nanda Pereira", whatsapp: "11990987654", registered: false },
    { name: "Duda Costa", email: "duda@example.com", whatsapp: "11989876543", registered: true },
    { name: "Carla Mendes", whatsapp: "11988765432", registered: false },
    { name: "Lu Almeida", email: "lu@example.com", whatsapp: "11987654320", registered: true },
  ]
  const clients = await Promise.all(
    clientsData.map((c) =>
      prisma.user.create({
        data: {
          id: c.email ? `usr_${c.email.split("@")[0]}` : undefined,
          name: c.name,
          email: c.email,
          whatsapp: c.whatsapp,
          passwordHash: c.registered ? clientPassword : null,
          role: "CLIENT",
        },
      }),
    ),
  )
  const mariana = clients[0]

  await prisma.clientNote.create({
    data: {
      businessId: business.id,
      clientId: mariana.id,
      text: "Formato amendoado, tom nude. Alergia a acetona.",
    },
  })

  console.log("→ agendamentos")
  const today = startOfDay(new TZDate(new Date(), TZ))
  let seq = 2400
  const nextCode = () => `${business.codePrefix}-${++seq}`

  type Slot = { day: Date; startMin: number }
  const morningStarts = [9 * 60, 10 * 60 + 15, 11 * 60 + 15]
  const afternoonStarts = [13 * 60 + 45, 14 * 60 + 15, 15 * 60 + 30, 16 * 60 + 30]

  async function createAppointment(
    slot: Slot,
    serviceTitle: string,
    clientIndex: number,
    status: AppointmentStatus,
    extra: { note?: string; origin?: "CLIENT" | "ADMIN" } = {},
  ) {
    const service = byTitle(serviceTitle)
    const startsAt = atLocalTime(slot.day, slot.startMin)
    const serviceEndsAt = addMinutes(startsAt, service.durationMin)
    const endsAt = addMinutes(serviceEndsAt, service.bufferMin)
    return prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: clients[clientIndex].id,
        serviceId: service.id,
        code: nextCode(),
        startsAt,
        serviceEndsAt,
        endsAt,
        status,
        origin: extra.origin ?? "CLIENT",
        note: extra.note,
        priceCents: service.priceCents,
        cancelledAt: status === "CANCELLED" ? subDays(startsAt, 2) : null,
        cancelledBy: status === "CANCELLED" ? "CLIENT" : null,
      },
    })
  }

  /* Histórico: últimos 60 dias, 2–3 atendimentos por dia útil, quase todos concluídos. */
  const serviceTitles = servicesData.map((s) => s.title)
  let created = 0
  for (let i = 60; i >= 1; i--) {
    const day = subDays(today, i)
    const weekday = new TZDate(day, TZ).getDay()
    if (weekday === 0) continue
    const starts = [pick(morningStarts), pick(afternoonStarts)]
    if (random() > 0.45) starts.push(pick([9 * 60, 16 * 60 + 30]))
    const used = new Set<number>()
    for (const startMin of starts) {
      if (used.has(startMin)) continue
      used.add(startMin)
      const r = random()
      const status: AppointmentStatus = r < 0.9 ? "DONE" : r < 0.96 ? "CANCELLED" : "NO_SHOW"
      // Mariana aparece com frequência para ter "6ª visita"
      const clientIndex = random() < 0.12 ? 0 : Math.floor(random() * clients.length)
      await createAppointment({ day, startMin }, pick(serviceTitles), clientIndex, status)
      created++
    }
  }

  /* Hoje: espelha o dashboard do Figma (concluído, confirmado, pendente). */
  const todayWeekday = new TZDate(today, TZ).getDay()
  if (todayWeekday !== 0) {
    await createAppointment({ day: today, startMin: 9 * 60 }, "Manutenção", 4, "DONE")
    await createAppointment(
      { day: today, startMin: 14 * 60 + 15 },
      "Alongamento em gel",
      0,
      "CONFIRMED",
      {
        note: "Formato amendoado, tom nude. Alergia a acetona.",
      },
    )
    await createAppointment({ day: today, startMin: 16 * 60 + 30 }, "Blindagem", 5, "PENDING")
    created += 3
  }

  /* Próximos 14 dias: confirmados e pendentes, respeitando domingo e o bloqueio de 4/11. */
  for (let i = 1; i <= 14; i++) {
    const day = addDays(today, i)
    const z = new TZDate(day, TZ)
    if (z.getDay() === 0) continue
    const blockedAfternoon = z.getMonth() === 10 && z.getDate() === 4
    const starts = [pick(morningStarts)]
    if (!blockedAfternoon && random() > 0.3) starts.push(pick(afternoonStarts))
    for (const startMin of starts) {
      const status: AppointmentStatus = random() < 0.7 ? "CONFIRMED" : "PENDING"
      await createAppointment(
        { day, startMin },
        pick(serviceTitles),
        Math.floor(random() * clients.length),
        status,
      )
      created++
    }
  }

  /* Os dois agendamentos futuros da Mariana (tela M7). */
  const thursday = (() => {
    let d = addDays(today, 1)
    while (new TZDate(d, TZ).getDay() !== 4) d = addDays(d, 1)
    return d
  })()
  await createAppointment(
    { day: thursday, startMin: 14 * 60 + 15 },
    "Alongamento em gel",
    0,
    "CONFIRMED",
    {
      note: "Formato amendoado, tom nude. Alergia a acetona.",
    },
  )
  await createAppointment(
    { day: addDays(thursday, 21), startMin: 10 * 60 },
    "Manutenção",
    0,
    "PENDING",
  )
  created += 2
  console.log(`   ${created} agendamentos`)

  console.log("→ portfólio")
  const albumsData: [string, number][] = [
    ["Alongamento", 10],
    ["Nail art", 8],
    ["Blindagem", 6],
  ]
  let photoIndex = 0
  for (const [name, count] of albumsData) {
    const album = await prisma.album.create({
      data: { businessId: business.id, name, order: albumsData.findIndex((a) => a[0] === name) },
    })
    const linkedService =
      name === "Alongamento"
        ? byTitle("Alongamento em gel")
        : name === "Blindagem"
          ? byTitle("Blindagem")
          : byTitle("Nail art")
    for (let i = 0; i < count; i++) {
      await prisma.photo.create({
        data: {
          businessId: business.id,
          albumId: album.id,
          serviceId: linkedService.id,
          url: `/placeholders/nail-${(photoIndex % 6) + 1}.svg`,
          caption: i === 0 && name === "Nail art" ? "Francesinha rosé com glitter" : null,
          isCover: i === 0 && name === "Alongamento",
          featuredOnBio: photoIndex < 3,
          wantThis: true,
          order: photoIndex,
        },
      })
      photoIndex++
    }
  }

  console.log("→ despesas")
  const month = new TZDate(today, TZ).getMonth() + 1
  const year = new TZDate(today, TZ).getFullYear()
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const fixed = [
    ["Aluguel do studio", "Aluguel", 5, 90000],
    ["Energia elétrica", "Contas (energia, internet)", 10, 18000],
    ["Internet", "Contas (energia, internet)", 10, 12000],
    ["Sistema de agenda + domínio", "Sistema e domínio", 12, 25000],
  ] as const
  const variable = [
    ["Materiais (gel, tips, lixas)", "Materiais e descartáveis", 8, 34000],
    ["Curso de nail art", "Cursos", 18, 30000],
    ["Descartáveis e higiene", "Materiais e descartáveis", 22, 18000],
  ] as const
  /* fixas: a raiz recorrente fica no mês anterior; o mês atual recebe a cópia (parentId) */
  const roots = new Map<string, string>()
  for (const [y, m] of [
    [prevYear, prevMonth],
    [year, month],
  ]) {
    for (const [description, category, day, amountCents] of fixed) {
      const created = await prisma.expense.create({
        data: {
          businessId: business.id,
          description,
          category,
          date: local(y, m, day),
          amountCents,
          type: "FIXED",
          recurrence: "MONTHLY",
          parentId: roots.get(description) ?? null,
        },
      })
      if (!roots.has(description)) roots.set(description, created.id)
    }
    for (const [description, category, day, amountCents] of variable) {
      await prisma.expense.create({
        data: {
          businessId: business.id,
          description,
          category,
          date: local(y, m, day),
          amountCents,
          type: "VARIABLE",
        },
      })
    }
  }

  console.log("✓ seed concluído")
  console.log("   admin:   leticia@minhaagenda.app / leticia123")
  console.log("   cliente: mariana@example.com / cliente123")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
