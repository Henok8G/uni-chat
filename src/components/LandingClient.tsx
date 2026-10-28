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

import Image from "next/image"
import { useScroll, useSpring } from "framer-motion"

// Optimized image dimensions (480px width instead of 2000px) reduces network load by ~95%
const exampleImages = [
  {
    url: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=75&w=480&auto=format&fit=crop",
    author: "Friends",
    title: "University friends hanging out",
  },
  {
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=75&w=480&auto=format&fit=crop",
    link: "#",
    title: "Students laughing together",
    author: "Campus Life",
  },
  {
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=75&w=480&auto=format&fit=crop",
    link: "#",
    author: "Study Group",
    title: "A group of students on campus",
  },
  {
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=75&w=480&auto=format&fit=crop",
    link: "#",
    author: "Library Meetup",
    title: "Students networking",
  },
  {
    url: "https://images.unsplash.com/photo-1498075702571-ecb018f3752d?q=75&w=480&auto=format&fit=crop",
    link: "#",
    author: "Tech Connect",
    title: "Connecting via laptops",
  },
  {
    url: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=75&w=480&auto=format&fit=crop",
    link: "#",
    author: "Video Call",
    title: "Excited video chat",
  },
  {
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=75&w=480&auto=format&fit=crop",
    title: "Networking event",
    author: "Meetup",
    link: "#",
  },
  {
    url: "https://images.unsplash.com/photo-1515161318750-781e6ba62002?q=75&w=480&auto=format&fit=crop",
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
          className="hidden sm:block top-[8%] left-[-5%] md:top-[25%] md:left-[5%]"
        >
          <motion.img
            src={exampleImages[0].url}
            alt={exampleImages[0].title}
            loading="eager"
            fetchPriority="high"
            className="w-16 h-12 sm:w-24 sm:h-16 md:w-28 md:h-20 lg:w-32 lg:h-24 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform -rotate-[3deg] shadow-2xl rounded-xl opacity-40 md:opacity-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        </FloatingElement>

        <FloatingElement
          depth={1}
          className="hidden md:block top-[0%] left-[8%] md:top-[6%] md:left-[11%]"
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
          className="hidden sm:block top-[85%] left-[-5%] md:top-[80%] md:left-[8%]"
        >
          <motion.img
            src={exampleImages[2].url}
            alt={exampleImages[2].title}
            loading="lazy"
            className="w-24 h-24 sm:w-48 sm:h-48 md:w-60 md:h-60 lg:w-64 lg:h-64 object-cover -rotate-[4deg] hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl rounded-xl opacity-40 md:opacity-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          />
        </FloatingElement>

        <FloatingElement
          depth={2}
          className="hidden md:block top-[0%] left-[87%] md:top-[2%] md:left-[83%]"
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
          className="hidden sm:block top-[75%] left-[80%] md:top-[68%] md:left-[83%]"
        >
          <motion.img
            src={exampleImages[4].url}
            alt={exampleImages[4].title}
            loading="lazy"
            className="w-24 h-24 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl rotate-[19deg] rounded-xl opacity-40 md:opacity-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          />
        </FloatingElement>
      </Floating>

      <div className="flex flex-col justify-center items-center w-full max-w-[360px] px-4 sm:max-w-[440px] md:max-w-[560px] lg:max-w-[700px] z-50 pointer-events-auto">
        {/* Student Network verification badge featuring the actual logo icon */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/8 dark:border-white/10 shadow-xs mb-4 sm:mb-6 cursor-default select-none"
        >
          <Image
            src="/images/logo-icon.png"
            alt="Uni-Chat Actual Logo"
            width={20}
            height={20}
            className="w-5 h-5 rounded-md object-contain shadow-2xs"
            priority
          />
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
            Ethiopia&apos;s Verified Student Network
          </span>
        </motion.div>

        <motion.h1
          className="text-3xl font-extrabold sm:text-5xl md:text-7xl lg:text-8xl text-center w-full justify-center items-center flex-col flex whitespace-pre leading-tight tracking-tight gap-2 sm:gap-4 md:gap-6"
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
              <span className="inline-block min-w-[140px] sm:min-w-[200px] md:min-w-[500px] lg:min-w-[280px] overflow-hidden">
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
          className="text-sm sm:text-lg md:text-xl lg:text-2xl px-2 font-medium text-center pt-3 sm:pt-8 md:pt-10 lg:pt-12 max-w-sm sm:max-w-xl"
          style={{ color: "var(--muted)" }}
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.5 }}
        >
          The only exclusive video chat strictly verified for Ethiopian University students.
        </motion.p>

        {/* CTA Buttons — stable row, never affected by TextRotate */}
        <motion.div
          className="flex flex-row justify-center space-x-3 sm:space-x-4 items-center mt-8 sm:mt-16 md:mt-20 lg:mt-20 text-sm font-semibold"
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.7 }}
        >
          {/* Primary: Verify Email — solid accent fill */}
          <motion.button
            className="px-5 py-3 whitespace-nowrap sm:text-base md:text-lg lg:text-xl font-semibold tracking-tight sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3 rounded-full z-20 shadow-lg transition-all flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: "var(--theme-accent)",
              color: "#fff",
              boxShadow: "0 4px 24px color-mix(in srgb, var(--theme-accent) 40%, transparent)",
            }}
          >
            <Link href="/auth/register" prefetch={true} className="hover:opacity-90 transition-opacity">
              Start Free Trial <span className="font-serif ml-1">→</span>
            </Link>
          </motion.button>

          {/* Secondary: Log In — bordered ghost */}
          <motion.button
            className="px-5 py-3 whitespace-nowrap sm:text-base md:text-lg lg:text-xl font-semibold tracking-tight sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3 rounded-full z-20 transition-colors duration-200 flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            style={{
              color: "var(--foreground)",
              border: "1.5px solid var(--border)",
              backgroundColor: "transparent",
            }}
          >
            <Link href="/auth/login" prefetch={true}>Log In</Link>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export function LandingClient() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div
      className="relative w-full min-h-screen font-sans overflow-x-hidden selection:bg-[#4A7BB0]/25"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Psychological dynamic scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-[#8E97F8] to-[#4A7BB0] origin-left z-[200] shadow-[0_0_12px_rgba(74,123,176,0.6)] pointer-events-none"
        style={{ scaleX }}
      />

      {/* Actual Logo Badge — Top Left of Landing Page */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-[100] flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm transition-colors select-none"
        title="Ethi-Uni-Chat"
      >
        <Image
          src="/images/logo-icon.png"
          alt="Uni-Chat Logo"
          width={28}
          height={28}
          className="w-7 h-7 rounded-lg object-contain shadow-xs"
          priority
        />
        <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
          Uni-Chat
        </span>
      </Link>

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


        <StaggerTestimonials />
        <SafetyPrivacySection />

      </main>

      {/* The beautifully animated classic footer */}
      <CinematicFooter />

      <LandingMenu />
    </div>
  )
}
