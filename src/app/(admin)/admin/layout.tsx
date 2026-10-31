import { BottomNav } from "@/components/layout/bottom-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { adminBottomNavItems, adminSidebarItems } from "@/features/admin/nav"
import { signOutAdminAction } from "@/features/auth/actions"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin()
  const business = await prisma.business.findUnique({
    where: { ownerId: user.id },
    select: { name: true, slug: true },
  })

  return (
    <div className="flex min-h-dvh">
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
