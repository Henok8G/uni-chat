"use client"

import React from "react"
import { motion } from "framer-motion"
import { GraduationCap, ShieldAlert, Lock, ExternalLink } from "lucide-react"

interface SafetyBlock {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const safetyBlocks: SafetyBlock[] = [
  {
    title: "Real students only",
    description: "Sign in with your university email so you're matched with real students, not random internet strangers. Each account is tied to a verified university; no anonymous throwaway profiles.",
    icon: <GraduationCap className="w-5 h-5" />
  },
  {
    title: "Instant reporting & active moderation",
    description: "Use the one-click report button during any chat. Reports go directly to admins who can warn or ban users that break our community guidelines.",
    icon: <ShieldAlert className="w-5 h-5" />
  },
  {
    title: "Privacy by design",
    description: "Calls are never recorded. We keep minimal session metadata for safety and analytics. Device logs are used only to detect abuse and prevent multi-account spam.",
    icon: <Lock className="w-5 h-5" />
  }
]

export function SafetyPrivacySection() {
  return (
    <section 
      id="safety-privacy"
      aria-labelledby="safety-privacy-heading"
      className="relative w-full py-24 px-6 flex flex-col items-center"
    >
      <div className="max-w-5xl w-full">
        {/* Header Area */}
        <div className="text-center mb-16 md:mb-20">
          <motion.h2 
            id="safety-privacy-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            style={{ color: "var(--text-heading)" }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Safe, moderated conversations for real students
          </motion.h2>
          <motion.p 
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: "var(--muted)" }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Ethi Uni Chat is built specifically for Ethiopian university students. 
            We've designed every interaction with reporting, moderation, and your privacy in mind.
          </motion.p>
        </div>

        {/* Content Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {safetyBlocks.map((block, idx) => (
            <motion.div 
              key={idx}
              data-animate="fade-up"
              className="flex flex-col space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: "var(--surface)", 
                  color: "var(--theme-accent)",
                  border: "1px solid var(--border)"
                }}
              >
                {block.icon}
              </div>
              <h3 
                className="text-xl font-bold tracking-tight"
                style={{ color: "var(--text-heading)" }}
              >
                {block.title}
              </h3>
              <p 
                className="text-sm md:text-base leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {block.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Policy Links Row */}
        <motion.div 
          className="mt-20 pt-8 border-t flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-medium uppercase tracking-widest"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a href="#" className="hover:opacity-70 transition-opacity flex items-center">
            Privacy Policy <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </a>
          <a href="#" className="hover:opacity-70 transition-opacity flex items-center">
            Terms of Use <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </a>
          <a href="#" className="hover:opacity-70 transition-opacity flex items-center">
            Community Guidelines <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
