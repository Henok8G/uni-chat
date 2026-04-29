"use client"

import { CinematicFooter } from "@/components/ui/motion-footer"
import Link from "next/link"
import { LayoutGroup, motion } from "framer-motion"
import { TextRotate } from "@/components/ui/text-rotate"
import Floating, { FloatingElement } from "@/components/ui/parallax-floating"
import { LandingMenu } from "@/components/LandingMenu"
import { ThemeToggle } from "@/components/ThemeToggle"
import dynamic from "next/dynamic"

// Lazy load below-the-fold components
const ProblemValueSection = dynamic(() => import("@/components/ProblemValueSection").then(m => m.ProblemValueSection), { ssr: false })
const ParallaxFeatures = dynamic(() => import("@/components/ui/parallax-scroll-feature-section").then(m => m.ParallaxFeatures), { ssr: false })
const HowItWorksSection = dynamic(() => import("@/components/HowItWorksSection").then(m => m.HowItWorksSection), { ssr: false })
const StaggerTestimonials = dynamic(() => import("@/components/ui/stagger-testimonials").then(m => m.StaggerTestimonials), { ssr: false })
const SafetyPrivacySection = dynamic(() => import("@/components/SafetyPrivacySection").then(m => m.SafetyPrivacySection), { ssr: false })
const PricingSection = dynamic(() => import("@/components/PricingSection").then(m => m.PricingSection), { ssr: false })

const exampleImages = [
  {
    url: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2000&auto=format&fit=crop",
    author: "Friends",
    title: "University friends hanging out",
  },
  {
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop",
    link: "#",
    title: "Students laughing together",
    author: "Campus Life",
  },
  {
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000&auto=format&fit=crop",
    link: "#",
    author: "Study Group",
    title: "A group of students on campus",
  },
  {
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000&auto=format&fit=crop",
    link: "#",
    author: "Library Meetup",
    title: "Students networking",
  },
  {
    url: "https://images.unsplash.com/photo-1498075702571-ecb018f3752d?q=80&w=2000&auto=format&fit=crop",
    link: "#",
    author: "Tech Connect",
    title: "Connecting via laptops",
  },
  {
    url: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=2000&auto=format&fit=crop",
    link: "#",
    author: "Video Call",
    title: "Excited video chat",
  },
  {
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000&auto=format&fit=crop",
    title: "Networking event",
    author: "Meetup",
    link: "#",
  },
  {
    url: "https://images.unsplash.com/photo-1515161318750-781e6ba62002?q=80&w=2000&auto=format&fit=crop",
    author: "Happy Student",
    link: "#",
    title: "A student smiling",
  },
]

function LandingHero() {
  return (
    <section className="w-full h-screen overflow-hidden md:overflow-visible flex flex-col items-center justify-center relative">
      <Floating sensitivity={-0.5} className="h-full">
        <FloatingElement
          depth={0.5}
          className="top-[15%] left-[2%] md:top-[25%] md:left-[5%]"
        >
          <motion.img
            src={exampleImages[0].url}
            alt={exampleImages[0].title}
            loading="eager"
            fetchPriority="high"
            className="w-16 h-12 sm:w-24 sm:h-16 md:w-28 md:h-20 lg:w-32 lg:h-24 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform -rotate-[3deg] shadow-2xl rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        </FloatingElement>

        <FloatingElement
          depth={1}
          className="top-[0%] left-[8%] md:top-[6%] md:left-[11%]"
        >
          <motion.img
            src={exampleImages[1].url}
            alt={exampleImages[1].title}
            loading="eager"
            fetchPriority="high"
            className="w-40 h-28 sm:w-48 sm:h-36 md:w-56 md:h-44 lg:w-60 lg:h-48 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform -rotate-12 shadow-2xl rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          />
        </FloatingElement>

        <FloatingElement
          depth={4}
          className="top-[90%] left-[6%] md:top-[80%] md:left-[8%]"
        >
          <motion.img
            src={exampleImages[2].url}
            alt={exampleImages[2].title}
            loading="lazy"
            className="w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 lg:w-64 lg:h-64 object-cover -rotate-[4deg] hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          />
        </FloatingElement>

        <FloatingElement
          depth={2}
          className="top-[0%] left-[87%] md:top-[2%] md:left-[83%]"
        >
          <motion.img
            src={exampleImages[3].url}
            alt={exampleImages[3].title}
            loading="eager"
            fetchPriority="high"
            className="w-40 h-36 sm:w-48 sm:h-44 md:w-60 md:h-52 lg:w-64 lg:h-56 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl rotate-[6deg] rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          />
        </FloatingElement>

        <FloatingElement
          depth={1}
          className="top-[78%] left-[83%] md:top-[68%] md:left-[83%]"
        >
          <motion.img
            src={exampleImages[4].url}
            alt={exampleImages[4].title}
            loading="lazy"
            className="w-44 h-44 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl rotate-[19deg] rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          />
        </FloatingElement>
      </Floating>

      <div className="flex flex-col justify-center items-center w-[280px] sm:w-[340px] md:w-[520px] lg:w-[700px] z-50 pointer-events-auto">
        <motion.h1
          className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-center w-full justify-center items-center flex-col flex whitespace-pre leading-tight tracking-tight gap-4 md:gap-6"
          style={{ color: "var(--text-heading)" }}
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.3 }}
        >
          <span>Meet students </span>
          <LayoutGroup>
            {/* Fixed-height row so button row never moves */}
            <motion.span layout className="flex whitespace-pre items-center h-[1.2em] sm:h-[1.2em]">
              <motion.span
                layout
                className="flex whitespace-pre shrink-0"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              >
                who are{" "}
              </motion.span>
              {/* Fixed width container prevents layout shift */}
              <span className="inline-block min-w-[160px] sm:min-w-[200px] md:min-w-[500px] lg:min-w-[280px] overflow-hidden">
                <TextRotate
                  texts={[
                    "fancy",
                    "fun",
                    "lovely🥰",
                    "creative",
                    "exciting✨",
                    "cool",
                    "smart🚀",
                    "awesome🔥",
                  ]}
                  mainClassName="overflow-hidden pr-3 py-0 pb-2 md:pb-4 rounded-xl font-bold"
                  style={{ color: 'var(--theme-accent)' }}
                  staggerDuration={0.03}
                  staggerFrom="last"
                  rotationInterval={3000}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              </span>
            </motion.span>
          </LayoutGroup>
        </motion.h1>

        <motion.p
          className="text-sm sm:text-lg md:text-xl lg:text-2xl text-center pt-4 sm:pt-8 md:pt-10 lg:pt-12"
          style={{ color: "var(--muted)" }}
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.5 }}
        >
          The only exclusive video chat strictly verified for Ethiopian University students.
        </motion.p>

        {/* CTA Buttons — stable row, never affected by TextRotate */}
        <motion.div
          className="flex flex-row justify-center space-x-4 items-center mt-10 sm:mt-16 md:mt-20 lg:mt-20 text-xs"
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.7 }}
        >
          {/* Primary: Verify Email — solid accent fill */}
          <motion.button
            className="sm:text-base md:text-lg lg:text-xl font-semibold tracking-tight px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3 rounded-full z-20 shadow-lg transition-all"
            style={{
              backgroundColor: "var(--theme-accent)",
              color: "#fff",
              boxShadow: "0 4px 24px color-mix(in srgb, var(--theme-accent) 40%, transparent)",
            }}
            whileHover={{
              scale: 1.05,
              transition: { type: "spring", damping: 30, stiffness: 400 },
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/auth/register">
              Start Free Trial <span className="font-serif ml-1">→</span>
            </Link>
          </motion.button>

          {/* Secondary: Log In — bordered ghost */}
          <motion.button
            className="sm:text-base md:text-lg lg:text-xl font-semibold tracking-tight px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3 rounded-full z-20 transition-all"
            style={{
              color: "var(--foreground)",
              border: "1.5px solid var(--border)",
              backgroundColor: "transparent",
            }}
            whileHover={{
              scale: 1.05,
              backgroundColor: "var(--surface)",
              transition: { type: "spring", damping: 30, stiffness: 400 },
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/auth/login">Log In</Link>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export function LandingClient() {
  return (
    <div
      className="relative w-full min-h-screen font-sans overflow-x-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Theme Toggle — top right */}
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>

      {/* MAIN CONTENT AREA */}
      <main
        className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start pb-32"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--hero-gradient)" }}
        />

        {/* Top Landing Hero Section */}
        <div className="w-full">
          <LandingHero />
        </div>

        <ProblemValueSection />
        <ParallaxFeatures />
        <HowItWorksSection />

        {/* Added PricingSection before SafetyPrivacySection per plan */}
        <PricingSection currentPlan="FREE" isPublic={true} />

        <StaggerTestimonials />
        <SafetyPrivacySection />

      </main>

      {/* The beautifully animated classic footer */}
      <CinematicFooter />

      <LandingMenu />
    </div>
  )
}
