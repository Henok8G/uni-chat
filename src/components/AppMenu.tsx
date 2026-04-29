"use client"

import { MenuBar } from "@/components/ui/bottom-menu"
import { Video, User, Settings as SettingsIcon, CreditCard } from "lucide-react"
import { usePathname } from "next/navigation"

const getAppMenuItems = (currentPath: string) => [
  {
    icon: Video,
    label: "Vid Chat",
    href: "/app"
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile"
  },
  {
    icon: CreditCard,
    label: "Plan",
    href: "/payment"
  },
  {
    icon: SettingsIcon,
    label: "Settings",
    href: "/settings"
  }
]

export function AppMenu() {
  const pathname = usePathname()
  
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <MenuBar items={getAppMenuItems(pathname || "")} />
    </div>
  )
}
