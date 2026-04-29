"use client";
import React from "react";
import { motion } from "framer-motion";

// Reusable column that auto-scrolls its testimonials vertically on a loop
export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: {
    text: string;
    image: string;
    name: string;
    role: string;
  }[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                className="p-8 rounded-3xl max-w-xs w-full backdrop-blur-sm shadow-lg transition-colors"
                key={i}
                style={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 4px 24px color-mix(in srgb, var(--theme-accent) 5%, transparent)",
                }}
              >
                <div className="italic leading-relaxed" style={{ color: "var(--muted-strong)" }}>&ldquo;{text}&rdquo;</div>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                    style={{ boxShadow: '0 0 0 2px var(--theme-accent)' }}
                  />
                  <div className="flex flex-col">
                    <div className="font-semibold tracking-tight leading-5" style={{ color: "var(--text-heading)" }}>{name}</div>
                    <div className="leading-5 text-sm tracking-tight" style={{ color: "var(--theme-accent)" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};
