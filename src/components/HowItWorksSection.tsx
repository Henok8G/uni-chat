"use client";

import { cn } from "@/lib/utils";
import { Mail, Settings2, Video } from "lucide-react";
import type React from "react";
import { motion } from "framer-motion";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  index: number;
}

const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
  index
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: index * 0.2 }}
    className={cn(
      "relative rounded-3xl border p-8 transition-all duration-300 ease-in-out",
      "hover:scale-105 hover:shadow-xl group"
    )}
    style={{
      backgroundColor: "var(--card-bg)",
      borderColor: "var(--card-border)",
      color: "var(--foreground)"
    }}
  >
    {/* Icon */}
    <div 
      className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors duration-300"
      style={{
        backgroundColor: "color-mix(in srgb, var(--theme-accent) 10%, transparent)",
        color: "var(--theme-accent)",
        borderColor: "color-mix(in srgb, var(--theme-accent) 20%, transparent)"
      }}
    >
      {icon}
    </div>
    {/* Title and Description */}
    <h3 className="mb-3 text-2xl font-bold tracking-tight" style={{ color: "var(--text-heading)" }}>{title}</h3>
    <p className="mb-8 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>{description}</p>
    {/* Benefits List */}
    <ul className="space-y-4">
      {benefits.map((benefit, i) => (
        <li key={i} className="flex items-center gap-4">
          <div 
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent) 20%, transparent)" }}
          >
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--theme-accent)" }}
            ></div>
          </div>
          <span className="font-medium" style={{ color: "var(--muted-strong)" }}>{benefit}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

export const HowItWorksSection: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const stepsData = [
    {
      icon: <Mail className="h-7 w-7" />,
      title: "Verify Student Status",
      description:
        "Create an account using your official .edu.et university email. Verify once to join our exclusive community.",
      benefits: [
        "Guaranteed safe environment",
        "Instant email confirmation",
        "Connect with verified peers only",
      ],
    },
    {
      icon: <Settings2 className="h-7 w-7" />,
      title: "Set Your Preferences",
      description:
        "Choose your department, academic year, and interests. Click 'Start' to find the perfect connection.",
      benefits: [
        "Smart matching algorithm",
        "Filter by campus and field",
        "Personalized study partners",
      ],
    },
    {
      icon: <Video className="h-7 w-7" />,
      title: "Match & Meet Instantly",
      description:
        "Jump straight into a 1-to-1 video chat. If the vibe isn't right, easily 'Next' to meet someone new.",
      benefits: [
        "High-quality video and text",
        "Interactive floating emojis",
        "Zero waiting times",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className={cn("relative w-full py-24 md:py-32 overflow-hidden", className)}
      {...props}
    >
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" style={{ backgroundColor: "var(--theme-accent)" }} />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-4xl text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6" style={{ color: "var(--text-heading)" }}>
            How it <span style={{ color: "var(--theme-accent)" }}>works</span>
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
            Getting started is simple. We've streamlined the process so you can 
            focus on having real conversations with real students.
          </p>
        </motion.div>

        {/* Step Indicators with Connecting Line */}
        <div className="relative mx-auto mb-12 w-full max-w-4xl hidden md:block">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2"
            style={{ backgroundColor: "var(--border)" }}
          ></div>
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full font-bold ring-8"
                style={{
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                  boxShadow: "0 0 0 8px var(--background)"
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              index={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
