"use client"

import { MenuBar } from "@/components/ui/bottom-menu"
import { BookOpen, Sparkles, MessageCircleHeart, LogIn, CreditCard } from "lucide-react"

const landingMenuItems = [
  {
    icon: BookOpen,
    label: "Story",
    href: "#story"
  },
  {
    icon: Sparkles,
    label: "Features",
    href: "#features"
  },
  {
    icon: MessageCircleHeart,
    label: "Testimonials",
    href: "#testimonials"
  },
  {
    icon: CreditCard,
    label: "Subscription",
    href: "#pricing"
  },
  {
    icon: LogIn,
    label: "Log In",
    href: "/auth/login"
  }
]

export function LandingMenu() {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <MenuBar items={landingMenuItems} />
    </div>
  )
}
