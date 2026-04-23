import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { Providers } from "@/components/Providers"
import PwaRegister from "@/components/PwaRegister"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "SocietyApp - The Modern OS for Your Housing Society",
  description: "Take control of your community finances, automate digital receipts, and manage members seamlessly with a beautiful, transparent platform.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },


  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SocietyApp",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PwaRegister />
        <Providers>
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
