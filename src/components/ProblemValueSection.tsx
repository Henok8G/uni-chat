"use client"

import React from "react"
import { motion } from "framer-motion"
import { Shield, Users, Video, Clock, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react"

export function ProblemValueSection() {
  return (
    <section 
      id="problem-value"
      aria-labelledby="problem-value-heading"
      className="relative w-full py-24 md:py-32 px-6 flex flex-col items-center overflow-hidden"
    >
      {/* Background decoration - optional subtle blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--theme-accent)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl w-full">
        {/* Header Section */}
        <motion.div 
          className="mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 
            id="problem-value-heading"
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 flex flex-col items-start gap-2"
            style={{ color: "var(--text-heading)" }}
          >
            <span className="overflow-hidden inline-block py-1">
              <motion.span className="inline-block" initial={{y: "100%"}} whileInView={{y: 0}} viewport={{once: true, margin: "-100px"}} transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}>
                Real connections
              </motion.span>
            </span>
            <span className="overflow-hidden inline-block py-1">
              <motion.span className="inline-block" initial={{y: "100%"}} whileInView={{y: 0}} viewport={{once: true, margin: "-100px"}} transition={{duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1]}}>
                for <span style={{ color: "var(--theme-accent)" }}>real students</span>.
              </motion.span>
            </span>
          </h2>
          <div 
            className="text-lg md:text-xl lg:text-2xl max-w-3xl leading-relaxed flex flex-col items-start gap-1"
            style={{ color: "var(--muted)" }}
          >
            <span className="overflow-hidden inline-block py-1"><motion.span className="inline-block" initial={{y: "100%"}} whileInView={{y: 0}} viewport={{once: true, margin: "-100px"}} transition={{duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}>Large campuses can feel incredibly small</motion.span></span>
            <span className="overflow-hidden inline-block py-1"><motion.span className="inline-block" initial={{y: "100%"}} whileInView={{y: 0}} viewport={{once: true, margin: "-100px"}} transition={{duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1]}}>when you're stuck in the same routine.</motion.span></span>
            <span className="overflow-hidden inline-block py-1"><motion.span className="inline-block" initial={{y: "100%"}} whileInView={{y: 0}} viewport={{once: true, margin: "-100px"}} transition={{duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1]}}>University life is big, busy, and sometimes isolating.</motion.span></span>
            <span className="overflow-hidden inline-block py-1"><motion.span className="inline-block" initial={{y: "100%"}} whileInView={{y: 0}} viewport={{once: true, margin: "-100px"}} transition={{duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1]}}>Meeting new people across departments shouldn't be a challenge.</motion.span></span>
          </div>
        </motion.div>

        {/* Two-Column Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
          
          {/* Left Side: The Problem */}
          <motion.div 
            className="flex flex-col space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center space-x-2">
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                The Problem
              </span>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: <Users className="w-5 h-5" />,
                  text: "Hard to meet new people outside your own class, department, or dorm building."
                },
                {
                  icon: <MessageSquare className="w-5 h-5" />,
                  text: "Group chats and social feeds are often noisy, shallow, and filled with distractions."
                },
                {
                  icon: <AlertCircle className="w-5 h-5" />,
                  text: "Random chat apps on the open internet feel unsafe, anonymous, and full of bots."
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  text: "Campus social events are irregular and don't always fit your packed academic schedule."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div 
                    className="mt-1 p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}
                  >
                    {item.icon}
                  </div>
                  <p className="text-base md:text-lg leading-snug" style={{ color: "var(--muted-strong)" }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Our Solution */}
          <motion.div 
            className="flex flex-col space-y-8 p-8 md:p-10 rounded-[2rem] border transition-colors relative"
            style={{ 
              backgroundColor: "var(--card-bg)", 
              borderColor: "var(--card-border)" 
            }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="inline-flex items-center space-x-2">
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: "color-mix(in srgb, var(--theme-accent) 15%, transparent)", 
                  color: "var(--theme-accent)",
                  border: "1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)"
                }}
              >
                Our Approach
              </span>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: <CheckCircle2 className="w-5 h-5" />,
                  text: "Instantly match with real students from your own university, verified by email."
                },
                {
                  icon: <Video className="w-5 h-5" />,
                  text: "Have real 1-to-1 video conversations with text chat, reactions, and smooth 'Next' flow."
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  text: "Stay safe with university-only access, instant reporting tools, and active moderation."
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  text: "Drop in for a quick 5-minute social break between classes instead of organizing big events."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div 
                    className="mt-1 p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent) 10%, transparent)", color: "var(--theme-accent)" }}
                  >
                    {item.icon}
                  </div>
                  <p className="text-base md:text-lg leading-snug font-medium" style={{ color: "var(--text-heading)" }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Trust Signal */}
            <div className="pt-6 mt-6 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm opacity-80 flex items-center" style={{ color: "var(--muted)" }}>
                <Shield className="w-4 h-4 mr-2" style={{ color: "var(--theme-accent)" }} />
                Built specifically for university communities. No calls are recorded.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
