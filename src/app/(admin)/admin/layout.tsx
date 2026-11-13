import { BottomNav } from "@/components/layout/bottom-nav"
import { BackgroundSlideshow } from "@/components/layout/background-slideshow"
import { Sidebar } from "@/components/layout/sidebar"
import { adminBottomNavItems, adminSidebarItems } from "@/features/admin/nav"
import { getAreaBackgrounds } from "@/features/backgrounds/queries"
import { signOutAdminAction } from "@/features/auth/actions"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

/*
 * Moldura do painel: mídias de fundo (escolhidas por tela em /admin/fundos),
 * sidebar translúcida no desktop e barra inferior no celular.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin()
  const business = await prisma.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true, slug: true },
  })
  const backgrounds = business ? await getAreaBackgrounds(business.id, "ADMIN") : null

  return (
    <div className="relative isolate flex min-h-dvh">
      {backgrounds ? <BackgroundSlideshow data={backgrounds} /> : null}
      <Sidebar
        items={adminSidebarItems}
        businessName={business?.name ?? user.name}
        publicHref="/"
        onSignOut={signOutAdminAction}
        className="sticky top-0 h-dvh"
      />
      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">{children}</div>
      <BottomNav items={adminBottomNavItems} />
    </div>
  )
}
