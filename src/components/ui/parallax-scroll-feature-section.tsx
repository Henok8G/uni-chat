"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown } from "lucide-react"

export const ParallaxFeatures = () => {
    const sections = [
        {
            id: 1,
            title: "Verified Students Only",
            description: "Say goodbye to bots and strangers. Uni-Chat uses strict .edu.et email verification to ensure you only connect with real Ethiopian university students.",
            imageUrl: '/images/ethiopian_students_campus.png',
            reverse: false
        },
        {
            id: 2,
            title: "Study & Connect Across Campuses",
            description: "Break down campus walls. Find study partners, discuss courses, or simply make new friends from AAU, AASTU, ASTU, and beyond in high-quality video chats.",
            imageUrl: '/images/ethiopian_students_library.png',
            reverse: true
        },
        {
            id: 3,
            title: "Secure & Private Rooms",
            description: "Your conversations matter. We built Uni-Chat with strict privacy controls so you can focus on meaningful interactions without worrying about your data.",
            imageUrl: '/images/ethiopian_male_video_chat.png',
            reverse: false
        }
    ]

    const sectionRefs = sections.map(() => useRef(null));
    
    const scrollYProgress = sections.map((_, index) => {
        return useScroll({
            target: sectionRefs[index],
            offset: ["start end", "center center"]
        }).scrollYProgress;
    });

    const opacityContents = scrollYProgress.map(progress => 
        useTransform(progress, [0, 0.7], [0, 1])
    );
    
    const clipProgresses = scrollYProgress.map(progress => 
        useTransform(progress, [0, 0.7], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"])
    );
    
    const translateContents = scrollYProgress.map(progress => 
        useTransform(progress, [0, 1], [-50, 0])
    );

  return (
    <section id="features" className="w-full bg-[var(--background)] text-[var(--foreground)] pb-32 overflow-hidden">
      <div className='min-h-[70vh] w-full flex flex-col items-center justify-center relative'>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--theme-accent)_0%,transparent_20%)] opacity-10 blur-[100px] pointer-events-none" />
        <h2 className='text-4xl md:text-6xl lg:text-7xl font-bold max-w-4xl text-center px-4'>
          The Ultimate Student <span style={{ color: "var(--theme-accent)" }}>Ecosystem</span>
        </h2>
        <p className='mt-10 flex items-center gap-2 text-sm md:text-base font-semibold tracking-widest uppercase text-[var(--muted)]'>
          Discover Features <ArrowDown size={18} className="animate-bounce" />
        </p>
      </div>
       <div className="flex flex-col md:px-0 px-6 max-w-6xl mx-auto">
            {sections.map((section, index) => (
                <div 
                    key={section.id}
                    ref={sectionRefs[index]} 
                    className={`min-h-[80vh] flex flex-col md:flex-row items-center justify-center md:gap-24 gap-12 ${section.reverse ? 'md:flex-row-reverse' : ''}`}
                >
                    <motion.div style={{ y: translateContents[index] }} className="flex-1">
                        <div className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: 'var(--text-heading)' }}>
                            {section.title}
                        </div>
                        <motion.p 
                            className="text-lg md:text-xl max-w-xl mt-6 leading-relaxed text-[var(--muted)]"
                        >
                            {section.description}
                        </motion.p>
                    </motion.div>
                    <motion.div 
                        style={{ 
                            opacity: opacityContents[index],
                            clipPath: clipProgresses[index],
                        }}
                        className="relative flex-1 w-full max-w-md aspect-square mt-12 md:mt-0"
                    >
                        <div className="absolute inset-0 border-2 border-[var(--theme-accent)]/20 rounded-3xl translate-x-4 translate-y-4" />
                        <img 
                            src={section.imageUrl} 
                            className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl" 
                            alt={section.title}
                        />
                    </motion.div>
                </div>
            ))}
        </div>
    </section>
  );
};
