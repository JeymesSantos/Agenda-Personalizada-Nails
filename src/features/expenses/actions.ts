"use server"

import { TZDate } from "@date-fns/tz"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { deleteUpload, saveUpload, validateImage } from "@/lib/storage"
import { expenseSchema, type ExpenseFormState } from "./schemas"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({
    where: { ownerId: user.id },
    select: { id: true, timezone: true },
  })
}

function revalidateExpenses() {
  revalidatePath("/admin/despesas")
  revalidatePath("/admin")
}

export async function saveExpenseAction(
  expenseId: string | null,
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const business = await ownerBusiness()
  const parsed = expenseSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    category: formData.get("category"),
    type: formData.get("type"),
    recurring: formData.get("recurring") === "on",
    receiptUrl: formData.get("receiptUrl") ?? "",
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const v = parsed.data
  const [y, m, d] = v.date.split("-").map(Number)
  const date = new TZDate(y, m - 1, d, 12, 0, 0, business.timezone)
  const data = {
    description: v.description,
    amountCents: v.amount,
    date,
    category: v.category,
    type: v.type,
    recurrence: v.recurring ? ("MONTHLY" as const) : ("NONE" as const),
    receiptUrl: v.receiptUrl || null,
  }

  if (expenseId) {
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, businessId: business.id },
    })
    if (!existing) return { error: "Despesa não encontrada." }
    await prisma.expense.update({ where: { id: expenseId }, data })
    if (existing.receiptUrl && existing.receiptUrl !== data.receiptUrl)
      await deleteUpload(existing.receiptUrl)
  } else {
    await prisma.expense.create({ data: { ...data, businessId: business.id } })
  }
  revalidateExpenses()
  return { success: expenseId ? "Despesa atualizada." : "Despesa lançada." }
}

export async function deleteExpenseAction(expenseId: string): Promise<ExpenseFormState> {
  const business = await ownerBusiness()
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, businessId: business.id },
  })
  if (!existing) return { error: "Despesa não encontrada." }
  await prisma.expense.delete({ where: { id: expenseId } })
  if (existing.receiptUrl) await deleteUpload(existing.receiptUrl)
  revalidateExpenses()
  return { success: "Despesa excluída." }
}

export async function uploadReceiptAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const business = await ownerBusiness()
  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "Nenhum arquivo enviado." }
  const invalid = validateImage(file)
  if (invalid) return { error: invalid }
  const { url } = await saveUpload(file, `comprovantes/${business.id}`)
  return { url }
}
