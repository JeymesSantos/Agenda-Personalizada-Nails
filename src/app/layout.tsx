import type { Metadata, Viewport } from "next"
import { DM_Sans, Montserrat } from "next/font/google"
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
}

export const viewport: Viewport = {
  themeColor: "#0E0A0C",
  colorScheme: "dark",
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${montserrat.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
