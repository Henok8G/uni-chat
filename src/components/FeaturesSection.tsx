"use client"

import React from "react"
import { motion } from "framer-motion"
import { Users, Video, Shield, Sparkles, CheckCircle2, ChevronRight } from "lucide-react"

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  delay?: number;
}

function FeatureCard({ icon, title, description, bullets, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      data-animate="fade-up"
      className="group relative rounded-[2rem] p-8 md:p-10 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
      style={{ 
        backgroundColor: "var(--card-bg)", 
        borderColor: "var(--card-border)" 
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ borderColor: "var(--theme-accent)" }}
    >
      {/* Subtle hover background glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: "var(--theme-accent)" }}
      />

      <div className="relative z-10">
        <div 
          className="mb-8 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ 
            backgroundColor: "color-mix(in srgb, var(--theme-accent) 15%, transparent)", 
            color: "var(--theme-accent)" 
          }}
        >
          {icon}
        </div>

        <h3 
          className="text-2xl font-bold mb-4 tracking-tight"
          style={{ color: "var(--text-heading)" }}
        >
          {title}
        </h3>

        <p 
          className="text-base md:text-lg mb-6 leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          {description}
        </p>

        <ul className="space-y-3">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start space-x-3">
              <CheckCircle2 
                className="w-5 h-5 mt-0.5 flex-shrink-0" 
                style={{ color: "var(--theme-accent)" }}
              />
              <span className="text-sm md:text-base" style={{ color: "var(--muted-strong)" }}>
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  const features = [
    {
      icon: <Users className="w-7 h-7" />,
      title: "Smart campus-only matching",
      description: "Match with real students from your university (and partner universities), filtered by department, year, and interests.",
      bullets: [
        "Verified student matching only",
        "Department and interest filters",
        "PRO: Faster routing and priority queue"
      ]
    },
    {
      icon: <Video className="w-7 h-7" />,
      title: "Real-time video & chat",
      description: "1-to-1 WebRTC video with text chat, designed for seamless transitions and high-quality connections.",
      bullets: [
        "High-quality, low-latency video",
        "Instant 'Next' matching flow",
        "Live connection state indicators"
      ]
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Safety, reporting & moderation",
      description: "An exclusive ecosystem built on trust, featuring strictly verified access and real-time safety tools.",
      bullets: [
        "University email verification required",
        "Active moderation & reporting tools",
        "No call recordings, only safety metadata"
      ]
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "Live reactions & collaboration",
      description: "Express yourself with modern interactions and tools built for shared student experiences.",
      bullets: [
        "Floating emoji reactions",
        "Real-time typing indicators",
        "Ready for future collaboration tools"
      ]
    }
  ]

  return (
    <section 
      id="features"
      aria-labelledby="features-heading"
      className="relative w-full py-24 md:py-32 px-6 flex flex-col items-center"
    >
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <motion.h2 
            id="features-heading"
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            style={{ color: "var(--text-heading)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Features built for <br className="hidden md:block" /> real campus conversations
          </motion.h2>
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--muted)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Connect without the noise. We've built tools that focus on your 
            university experience, safety, and authentic human connection.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <FeatureCard 
              key={idx}
              {...feature}
              delay={idx * 0.1}
            />
          ))}
        </div>

        {/* Optional: Final CTA or context hook */}
        <motion.div 
          className="mt-20 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div 
            className="inline-flex items-center space-x-2 text-sm font-medium opacity-70"
            style={{ color: "var(--muted)" }}
          >
            <span>Always evolving with our student community</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
