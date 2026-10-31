import { NextResponse, type NextRequest } from "next/server"

import { getExpensesData } from "@/features/expenses/queries"
import { fmt } from "@/lib/dates"
import { formatCentsExact } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

/* Exporta as despesas do mês (?mes=YYYY-MM) em CSV com ; e BOM, para abrir direto no Excel em pt-BR. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") return new NextResponse("Não autorizado", { status: 401 })
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const mes = request.nextUrl.searchParams.get("mes") ?? undefined
  const data = await getExpensesData(business.id, mes, new Date(), business.timezone)

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [
    ["Descrição", "Categoria", "Tipo", "Data", "Recorrência", "Valor"].map(escape).join(";"),
    ...data.expenses.map((e) =>
      [
        e.description,
        e.category,
        e.type === "FIXED" ? "Fixa" : "Variável",
        fmt(e.date, "dd/MM/yyyy", business.timezone),
        e.recurrence === "MONTHLY" ? "Mensal" : "",
        formatCentsExact(e.amountCents).replace("R$ ", ""),
      ]
        .map(escape)
        .join(";"),
    ),
    [
      "Total do mês",
      "",
      "",
      "",
      "",
      formatCentsExact(data.summary.expensesCents).replace("R$ ", ""),
    ]
      .map(escape)
      .join(";"),
  ]
  const CRLF = String.fromCharCode(13, 10)
  const csv = String.fromCharCode(0xfeff) + lines.join(CRLF)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="despesas-${data.range.key}.csv"`,
    },
  })
}
