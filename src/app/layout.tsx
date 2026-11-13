import type { Metadata, Viewport } from "next"
import { DM_Sans, Montserrat } from "next/font/google"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400"],
})

export const metadata: Metadata = {
  title: {
    default: "MinhaAgenda",
    template: "%s · MinhaAgenda",
  },
  description: "Agenda online para nail designer",
  applicationName: "MinhaAgenda",
  /* PWA: manifest em app/manifest.ts; ícones em app/icon.png, app/apple-icon.png e public/icons */
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MinhaAgenda",
    /* barra de status opaca: o conteúdo não fica por baixo dela no iOS */
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#0E0A0C",
  colorScheme: "dark",
  viewportFit: "cover",
  /* inputs têm 16px, então o iOS não dá zoom ao focar; aqui só evita o zoom por pinça acidental em telas de app */
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("dark h-full", dmSans.variable, montserrat.variable)}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
