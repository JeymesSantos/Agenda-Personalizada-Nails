import Link from "next/link"
import { addMonths } from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ReceiptIcon,
  RepeatIcon,
  WalletIcon,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { InfoBox } from "@/components/ui/info-box"
import { KpiCard } from "@/components/ui/kpi-card"
import { ExpenseDialog } from "@/features/expenses/components/expense-dialog"
import { ExpenseRowActions } from "@/features/expenses/components/expense-row-actions"
import { getExpensesData } from "@/features/expenses/queries"
import { capitalize, fmt, tz } from "@/lib/dates"
import { deltaPct } from "@/lib/finance"
import { formatCents, formatPercent } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Despesas" }

export default async function DespesasPage({ searchParams }: PageProps<"/admin/despesas">) {
  const user = await requireAdmin()
  const sp = await searchParams
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const timezone = business.timezone
  const now = new Date()
  const data = await getExpensesData(
    business.id,
    typeof sp.mes === "string" ? sp.mes : undefined,
    now,
    timezone,
  )
  const { range, summary } = data
  const monthLabel = capitalize(fmt(range.start, "MMMM yyyy", timezone))
  const prevKey = fmt(addMonths(range.start, -1), "yyyy-MM", timezone)
  const nextKey = fmt(addMonths(range.start, 1), "yyyy-MM", timezone)
  const todayYmd = fmt(tz(now, timezone), "yyyy-MM-dd", timezone)
  const delta = deltaPct(summary.expensesCents, data.prevTotalCents)

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow={`Financeiro · ${monthLabel}`}
        variant="heading"
        title="Despesas"
        actions={
          <>
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <a href={`/admin/despesas/export?mes=${range.key}`}>
                <DownloadIcon /> Exportar CSV
              </a>
            </Button>
            <ExpenseDialog
              categories={data.categories}
              todayYmd={todayYmd}
              defaultOpen={sp.nova === "1"}
            />
          </>
        }
      />

      <div className="flex items-center gap-2">
        <Button asChild variant="soft" size="icon-sm" aria-label="Mês anterior">
          <Link href={`/admin/despesas?mes=${prevKey}`}>
            <ChevronLeftIcon />
          </Link>
        </Button>
        <span className="type-body-medium min-w-36 text-center">{monthLabel}</span>
        <Button asChild variant="soft" size="icon-sm" aria-label="Próximo mês">
          <Link href={`/admin/despesas?mes=${nextKey}`}>
            <ChevronRightIcon />
          </Link>
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <KpiCard
          icon={<ReceiptIcon />}
          label="Despesas do mês"
          value={formatCents(summary.expensesCents)}
          delta={delta != null ? `${formatPercent(delta, true)} vs. mês anterior` : undefined}
          deltaTone={delta != null && delta > 0 ? "error" : "success"}
          hint={delta == null ? "Sem base de comparação" : undefined}
        />
        <KpiCard
          icon={<RepeatIcon />}
          label="Fixas"
          value={formatCents(summary.fixedCents)}
          hint={`${data.recurringCount} lançamento${data.recurringCount === 1 ? "" : "s"} recorrente${data.recurringCount === 1 ? "" : "s"}`}
        />
        <KpiCard
          icon={<WalletIcon />}
          label="Variáveis"
          value={formatCents(summary.variableCents)}
          hint={`${data.variableCount} lançamento${data.variableCount === 1 ? "" : "s"}`}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="py-0">
          <CardContent className="px-0">
            {data.expenses.length === 0 ? (
              <EmptyState
                title="Nenhuma despesa neste mês"
                description="Lance aluguel, materiais e contas para acompanhar o lucro."
                className="m-5"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="type-caption text-muted-txt border-subtle border-b">
                      <th className="px-5 py-4 text-left font-medium">Descrição</th>
                      <th className="hidden px-3 py-4 text-left font-medium sm:table-cell">
                        Categoria
                      </th>
                      <th className="px-3 py-4 text-left font-medium">Data</th>
                      <th className="hidden px-3 py-4 text-left font-medium md:table-cell">
                        Recorrência
                      </th>
                      <th className="px-3 py-4 text-right font-medium">Valor</th>
                      <th className="w-20 px-3 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e) => (
                      <tr key={e.id} className="border-subtle border-b last:border-b-0">
                        <td className="type-body-medium px-5 py-4">
                          {e.description}
                          <span className="type-body text-secondary-txt block sm:hidden">
                            {e.category}
                          </span>
                        </td>
                        <td className="hidden px-3 py-4 sm:table-cell">
                          <Badge variant={e.type === "FIXED" ? "info" : "magenta"}>
                            {e.type === "FIXED" ? "Fixa" : "Variável"}
                          </Badge>
                          <span className="type-body text-secondary-txt ml-2 hidden lg:inline">
                            {e.category}
                          </span>
                        </td>
                        <td className="type-body text-secondary-txt px-3 py-4 whitespace-nowrap">
                          {fmt(e.date, "dd/MM", timezone)}
                        </td>
                        <td className="type-body text-secondary-txt hidden px-3 py-4 md:table-cell">
                          {e.recurrence === "MONTHLY" ? "Mensal" : "—"}
                        </td>
                        <td className="type-body-medium text-error px-3 py-4 text-right whitespace-nowrap">
                          − {formatCents(e.amountCents)}
                        </td>
                        <td className="px-3 py-2">
                          <ExpenseRowActions
                            categories={data.categories}
                            todayYmd={todayYmd}
                            expense={{
                              id: e.id,
                              description: e.description,
                              amountCents: e.amountCents,
                              dateYmd: fmt(e.date, "yyyy-MM-dd", timezone),
                              category: e.category,
                              type: e.type,
                              recurring: e.recurrence === "MONTHLY",
                              receiptUrl: e.receiptUrl,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-subtle border-t">
                      <td colSpan={4} className="type-body-medium px-5 py-4">
                        Total do mês
                      </td>
                      <td className="type-h3 text-error px-3 py-4 text-right whitespace-nowrap">
                        − {formatCents(summary.expensesCents)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Por categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {data.byCategory.length === 0 ? (
              <p className="type-body text-secondary-txt">Sem lançamentos.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {data.byCategory.map((c) => (
                  <li key={c.category} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="type-body-medium truncate">{c.category}</span>
                      <span className="type-body text-secondary-txt shrink-0">
                        {formatCents(c.amountCents)} · {c.pct}%
                      </span>
                    </div>
                    <div className="bg-elevated h-1 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-gradient-primary h-full rounded-full"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <InfoBox tone={summary.profitCents >= 0 ? "success" : "warning"}>
              {summary.profitCents >= 0 ? "Lucro" : "Prejuízo"} de{" "}
              {fmt(range.start, "MMMM", timezone)}: {formatCents(Math.abs(summary.profitCents))}
              {summary.revenueCents > 0
                ? ` (${Math.abs(summary.marginPct)}% do faturamento)`
                : " (sem faturamento no mês)"}
              .
            </InfoBox>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
