"use client"

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 0,
    testimonial: "Uni-Chat completely changed how I connect with students across campuses. The email verification makes it feel genuinely safe and exclusive.",
    by: "Betelhem Tadesse, Computer Science at AAU",
    imgSrc: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  {
    tempId: 1,
    testimonial: "Setting up my profile was instant. The super clean interface made it effortless to start chatting within minutes.",
    by: "Natnael Dereje, Engineering at AASTU",
    imgSrc: "/images/ethiopian_male_video_chat.png"
  },
  {
    tempId: 2,
    testimonial: "The support is amazing — I had a question about verification and got a response right away. Really impressed.",
    by: "Saman Girma, Business at ASTU",
    imgSrc: "https://randomuser.me/api/portraits/women/3.jpg"
  },
  {
    tempId: 3,
    testimonial: "Finding study partners from other universities has never been easier. The matching is surprisingly good.",
    by: "Yonas Mekonnen, Medicine at AAU Sefere Selam",
    imgSrc: "https://randomuser.me/api/portraits/men/4.jpg"
  },
  {
    tempId: 4,
    testimonial: "The video quality is crystal clear. We studied together for finals across three different cities — zero lag.",
    by: "Hiwot Alemu, IT at ASTU",
    imgSrc: "/images/ethiopian_female_student.png"
  },
  {
    tempId: 5,
    testimonial: "I've recommended Uni-Chat to my entire department. It's the only platform that actually feels built for students like us.",
    by: "Meron Kebede, Law at AAU 6 Kilo",
    imgSrc: "https://randomuser.me/api/portraits/women/6.jpg"
  },
  {
    tempId: 6,
    testimonial: "No random strangers, no bots. Just real Ethiopian students. That alone makes Uni-Chat worth it.",
    by: "Dawit Haile, Architecture at EiABC",
    imgSrc: "https://randomuser.me/api/portraits/men/7.jpg"
  },
  {
    tempId: 7,
    testimonial: "I made friends from campuses I didn't even know existed. This platform genuinely broadens your world.",
    by: "Rahel Solomon, Psychology at ASTU",
    imgSrc: "/images/ethiopian_students_library.png"
  },
  {
    tempId: 8,
    testimonial: "The exclusive .edu.et verification is genius. It filters out everything that makes other platforms exhausting.",
    by: "Biruk Tesfaye, Economics at AAU",
    imgSrc: "https://randomuser.me/api/portraits/men/9.jpg"
  }
];

interface TestimonialCardProps {
  position: number;
  testimonial: typeof testimonials[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  position, 
  testimonial, 
  handleMove, 
  cardSize 
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
        isCenter 
          ? "z-10 bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]" 
          : "z-0 bg-[var(--surface-alt)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--theme-accent)]/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px var(--border)" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-[var(--border)]"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2
        }}
      />
      <img
        src={testimonial.imgSrc}
        alt={`${testimonial.by.split(',')[0]}`}
        className="mb-4 h-14 w-12 bg-[var(--muted)] object-cover object-center"
        style={{
          boxShadow: "3px 3px 0px var(--background)"
        }}
      />
      <h3 className={cn(
        "text-base sm:text-lg lg:text-xl font-medium",
        isCenter ? "text-white" : "text-[var(--foreground)]"
      )}>
        "{testimonial.testimonial}"
      </h3>
      <p className={cn(
        "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
        isCenter ? "text-white/80" : "text-[var(--muted)]"
      )}>
        - {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <section id="testimonials" className="relative w-full py-24 flex flex-col items-center z-10 overflow-hidden">
      <div className="container z-10 mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10">
          <div className="flex justify-center">
            <div
              className="border py-1 px-4 rounded-lg text-sm font-medium"
              style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}
            >
              Testimonials
            </div>
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-5 text-center"
            style={{ color: "var(--text-heading)" }}
          >
            What our peers say
          </h2>
          <p className="text-center mt-5" style={{ color: "var(--muted)" }}>
            See what Ethiopian university students have to say about us.
          </p>
        </div>
      </div>

      <div
        className="relative w-full max-w-[100vw] overflow-hidden"
        style={{ height: 600 }}
      >
          {testimonialsList.map((testimonial, index) => {
            const position = testimonialsList.length % 2
              ? index - (testimonialsList.length - 1) / 2
              : index - testimonialsList.length / 2;
            return (
              <TestimonialCard
                key={testimonial.tempId}
                testimonial={testimonial}
                handleMove={handleMove}
                position={position}
                cardSize={cardSize}
              />
            );
          })}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-20">
            <button
              onClick={() => handleMove(-1)}
              className={cn(
                "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
                "bg-[var(--background)] border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--theme-accent)] hover:text-white hover:border-[var(--theme-accent)] rounded-xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleMove(1)}
              className={cn(
                "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
                "bg-[var(--background)] border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--theme-accent)] hover:text-white hover:border-[var(--theme-accent)] rounded-xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
    </section>
  );
};
