import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { loginAdmin, TestDb } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

for (const width of [390, 1440]) {
  test(`painel mostra só WhatsApp e preserva e-mails antigos (${width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    const appointment = await db.one<{ id: string }>(
      `select a.id from "Appointment" a
       join "User" u on u.id = a."clientId"
       where a.status = 'CONFIRMED' and u.whatsapp is not null
         and (select count(*) from "Reminder" r where r."appointmentId" = a.id
              and r.channel = 'WHATSAPP' and r.status = 'SCHEDULED') = 3
       order by a."startsAt" desc limit 1`,
    )
    expect(appointment).not.toBeNull()
    const prefix = randomUUID()
    try {
      // Simula os três e-mails antigos da captura, inclusive a confirmação já enviada.
      await db.one(
        `insert into "Reminder" (id, "appointmentId", channel, kind, "sendAt", "sentAt", status, "createdAt")
         select $2 || r.id, r."appointmentId", 'EMAIL', r.kind, r."sendAt",
                case when r.kind = 'CONFIRMATION' then now() else null end,
                case when r.kind = 'CONFIRMATION' then 'SENT'::"ReminderStatus" else 'SCHEDULED'::"ReminderStatus" end, now()
         from "Reminder" r where r."appointmentId" = $1 and r.channel = 'WHATSAPP'`,
        [appointment!.id, prefix],
      )
      await loginAdmin(page)
      await page.goto(`/admin/agenda?visao=dia&agendamento=${appointment!.id}`)
      const reminders = page
        .locator("div")
        .filter({
          has: page.getByText("Lembretes", { exact: true }),
        })
        .filter({ has: page.locator("ul") })
        .last()
      await expect(reminders.locator("li")).toHaveCount(3)
      await expect(reminders.getByRole("link", { name: "Abrir WhatsApp" })).toHaveCount(3)
      const confirmation = reminders.locator("li").filter({
        has: page.getByText("Confirmação", { exact: true }),
      })
      await expect(confirmation.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute(
        "href",
        /https:\/\/wa.me\/55/,
      )
      await confirmation.getByRole("button", { name: "Marcar enviado" }).click()
      await expect(confirmation.getByText("Enviado", { exact: true })).toBeVisible()
      await expect(confirmation.getByRole("button", { name: "Marcar enviado" })).toHaveCount(0)
      await page.reload()
      await expect(reminders.locator("li")).toHaveCount(3)
      await expect(confirmation.getByText("Enviado", { exact: true })).toBeVisible()
      expect(
        await db.count(
          `select count(*) from "Reminder" where "appointmentId" = $1 and channel = 'EMAIL'`,
          [appointment!.id],
        ),
      ).toBe(3)
      await reminders.screenshot({ path: testInfo.outputPath(`lembretes-${width}.png`) })
    } finally {
      await db.one('delete from "Reminder" where "appointmentId" = $1 and id like $2', [
        appointment!.id,
        `${prefix}%`,
      ])
      await db.one(
        `update "Reminder" set status = 'SCHEDULED', "sentAt" = null
         where "appointmentId" = $1 and channel = 'WHATSAPP' and kind = 'CONFIRMATION'`,
        [appointment!.id],
      )
    }
  })
}
