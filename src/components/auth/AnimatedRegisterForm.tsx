"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GraduationCap, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// --- Pupil & EyeBall Reusable Components ---
interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
  mouseX?: number;
  mouseY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5, 
  pupilColor = "black", 
  forceLookX, 
  forceLookY,
  mouseX = 0,
  mouseY = 0
}: PupilProps) => {
  const pupilRef = useRef<HTMLDivElement>(null);

  const pupilPosition = (() => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const pupil = pupilRef.current.getBoundingClientRect();
    const deltaX = mouseX - (pupil.left + pupil.width / 2);
    const deltaY = mouseY - (pupil.top + pupil.height / 2);
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  })();

  return (
    <div 
      ref={pupilRef} 
      className="rounded-full" 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        backgroundColor: pupilColor, 
        transform: `translate(${pupilPosition.x.toFixed(1)}px, ${pupilPosition.y.toFixed(1)}px)`, 
        transition: 'transform 0.1s ease-out' 
      }} 
    />
  );
};

interface EyeBallProps {
  size?: number; 
  pupilSize?: number; 
  maxDistance?: number; 
  eyeColor?: string; 
  pupilColor?: string; 
  isBlinking?: boolean; 
  forceLookX?: number; 
  forceLookY?: number;
  mouseX?: number;
  mouseY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10, 
  eyeColor = "white", 
  pupilColor = "black", 
  isBlinking = false, 
  forceLookX, 
  forceLookY,
  mouseX = 0,
  mouseY = 0
}: EyeBallProps) => {
  const eyeRef = useRef<HTMLDivElement>(null);

  const pupilPosition = (() => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const eye = eyeRef.current.getBoundingClientRect();
    const deltaX = mouseX - (eye.left + eye.width / 2);
    const deltaY = mouseY - (eye.top + eye.height / 2);
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  })();

  return (
    <div 
      ref={eyeRef} 
      className="rounded-full flex items-center justify-center transition-all duration-150" 
      style={{ 
        width: `${size}px`, 
        height: isBlinking ? '2px' : `${size}px`, 
        backgroundColor: eyeColor, 
        overflow: 'hidden' 
      }}
    >
      {!isBlinking && (
        <div 
          className="rounded-full" 
          style={{ 
            width: `${pupilSize}px`, 
            height: `${pupilSize}px`, 
            backgroundColor: pupilColor, 
            transform: `translate(${pupilPosition.x.toFixed(1)}px, ${pupilPosition.y.toFixed(1)}px)`, 
            transition: 'transform 0.1s ease-out' 
          }} 
        />
      )}
    </div>
  );
};

// --- Visual Gender Card (Apple-Inspired Squircle) ---
function GenderCard({
  gender,
  selected,
  onClick,
}: {
  gender: "MALE" | "FEMALE";
  selected: boolean;
  onClick: () => void;
}) {
  const isMale = gender === "MALE";

  const config = isMale
    ? {
        label: "Male",
        emoji: <img src="/assets/emojis/man-student.png" className="w-[1em] h-[1em] inline-block align-middle" alt="👨‍🎓" />,
        description: "Steel blue · Powder · Sage",
        bg: "from-blue-50/70 to-slate-100/70 dark:from-blue-950/20 dark:to-slate-900/30",
        border: "border-blue-500/80 dark:border-blue-400/80",
        ring: "ring-2 ring-blue-500/20",
        badge: "bg-blue-100/90 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        dot: "bg-blue-500",
        swatches: ["#B0C4DE", "#B0E0E6", "#98FB98", "#E6E6FA", "#778899"],
      }
    : {
        label: "Female",
        emoji: <img src="/assets/emojis/woman-student.png" className="w-[1em] h-[1em] inline-block align-middle" alt="👩‍🎓" />,
        description: "Blush · Peach · Lavender",
        bg: "from-pink-50/70 to-rose-50/70 dark:from-pink-950/20 dark:to-rose-900/30",
        border: "border-pink-500/80 dark:border-pink-400/80",
        ring: "ring-2 ring-pink-500/20",
        badge: "bg-pink-100/90 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
        dot: "bg-pink-500",
        swatches: ["#FFB3BA", "#FFA07A", "#F5DEB3", "#D8BFD8", "#E6E6FA"],
      };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${config.label} - ${config.description}`}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-2 rounded-2xl border p-3 sm:p-4 w-full
        transition-all duration-200 text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500
        active:scale-[0.98] select-none
        bg-gradient-to-b ${config.bg} backdrop-blur-sm
        ${selected
          ? `${config.border} shadow-md ${config.ring} scale-[1.01]`
          : "border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 opacity-90 hover:opacity-100"
        }
      `}
    >
      {/* Checkmark indicator */}
      <div className={`
        absolute top-2.5 right-2.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center
        transition-all duration-200
        ${selected ? `${config.dot} border-transparent shadow-xs` : "border-zinc-300 dark:border-zinc-600 bg-white/40 dark:bg-zinc-800/40"}
      `}>
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Avatar emoji */}
      <div className="text-3xl sm:text-4xl mt-0.5 filter drop-shadow-xs">{config.emoji}</div>

      {/* Label */}
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${config.badge}`}>
        {config.label}
      </span>

      {/* Description */}
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-tight">{config.description}</span>

      {/* Color swatches */}
      <div className="flex gap-1.5 mt-0.5">
        {config.swatches.map((c) => (
          <div
            key={c}
            className="w-3.5 h-3.5 rounded-full border border-white/60 dark:border-black/30 shadow-xs"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </button>
  );
}

// --- Main Register Component ---
type FormState = { status: "idle" } | { status: "error"; message: string } | { status: "success"; message: string };
type RegisterAction = (prevState: FormState, formData: FormData) => Promise<FormState>;

export function AnimatedRegisterForm({ action, universities }: {
  action: RegisterAction;
  universities: { id: string; name: string; domain: string }[]
}) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as FormState);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);

  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setMouseX(e.clientX);
        setMouseY(e.clientY);
        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true); setTimeout(() => { setIsPurpleBlinking(false); scheduleBlink(); }, 150);
      }, Math.random() * 4000 + 3000);
      return blinkTimeout;
    };
    const t = scheduleBlink(); return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true); setTimeout(() => { setIsBlackBlinking(false); scheduleBlink(); }, 150);
      }, Math.random() * 4000 + 3000);
      return blinkTimeout;
    };
    const t = scheduleBlink(); return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };
      const t = schedulePeek(); return () => clearTimeout(t);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 w-full">
      {/* Left Content Section */}
      <div 
        className="relative hidden lg:flex flex-col justify-between p-12 transition-colors border-r min-h-[650px]"
        style={{ 
          backgroundColor: "var(--surface)", 
          borderColor: "var(--card-border)",
          color: "var(--foreground)" 
        }}
      >
        <div className="relative z-20">
          <Link href="/" className="inline-flex items-center gap-2 group transition-opacity hover:opacity-90" title="Uni-Chat">
            <Image
              src="/images/logo-horizontal-light.png"
              alt="Uni-Chat"
              width={140}
              height={36}
              className="h-8 w-auto object-contain block dark:hidden"
              priority
            />
            <Image
              src="/images/logo-horizontal-dark.png"
              alt="Uni-Chat"
              width={140}
              height={36}
              className="h-8 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[550px]">
          {/* Cartoon Characters Container */}
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            {/* Purple Character */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '70px', width: '180px', height: (isTyping || (password.length > 0 && !showPassword)) ? '460px' : '400px', backgroundColor: '#B0C4DE', borderRadius: '10px 10px 0 0', zIndex: 1, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${purplePos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{ left: (password.length > 0 && showPassword) ? `20px` : isLookingAtEachOther ? `55px` : `${45 + purplePos.faceX}px`, top: (password.length > 0 && showPassword) ? `35px` : isLookingAtEachOther ? `65px` : `${40 + purplePos.faceY}px` }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} mouseX={mouseX} mouseY={mouseY} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              </div>
            </div>

            {/* Black Character */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '240px', width: '120px', height: '330px', backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : isLookingAtEachOther ? `skewX(${(blackPos.bodySkew) * 1.5 + 10}deg) translateX(20px)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(blackPos.bodySkew) * 1.5}deg)` : `skewX(${blackPos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{ left: (password.length > 0 && showPassword) ? `10px` : isLookingAtEachOther ? `32px` : `${26 + blackPos.faceX}px`, top: (password.length > 0 && showPassword) ? `28px` : isLookingAtEachOther ? `12px` : `${32 + blackPos.faceY}px` }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              </div>
            </div>

            {/* Orange Character */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '0px', width: '240px', height: '200px', backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0', zIndex: 3, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-8 transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `50px` : `${82 + orangePos.faceX}px`, top: (password.length > 0 && showPassword) ? `85px` : `${90 + orangePos.faceY}px` }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              </div>
            </div>

            {/* Yellow Character */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '310px', width: '140px', height: '230px', backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-6 transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `20px` : `${52 + yellowPos.faceX}px`, top: (password.length > 0 && showPassword) ? `35px` : `${40 + yellowPos.faceY}px` }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} mouseX={mouseX} mouseY={mouseY} />
              </div>
              <div className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `10px` : `${40 + yellowPos.faceX}px`, top: (password.length > 0 && showPassword) ? `88px` : `${88 + yellowPos.faceY}px` }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm transition-colors" style={{ color: "var(--muted)" }}>
          <a href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[var(--foreground)] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
        </div>
      </div>

      {/* Right Content Section (Registration) */}
      <div className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 transition-colors min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <div className="w-full max-w-[440px] my-auto bg-white/75 dark:bg-zinc-900/75 backdrop-blur-2xl rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xl shadow-zinc-950/5 dark:shadow-black/40">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="lg:hidden flex items-center justify-center mb-4">
              <Link href="/" className="inline-flex items-center gap-2 group transition-transform active:scale-95" title="Uni-Chat">
                <Image
                  src="/images/logo-horizontal-light.png"
                  alt="Uni-Chat"
                  width={130}
                  height={32}
                  className="h-7 w-auto object-contain block dark:hidden"
                  priority
                />
                <Image
                  src="/images/logo-horizontal-dark.png"
                  alt="Uni-Chat"
                  width={130}
                  height={32}
                  className="h-7 w-auto object-contain hidden dark:block"
                  priority
                />
              </Link>
            </div>

            {/* Apple-style Institutional Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-3 shadow-xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>AAU Pilot Access · @aau.edu.et</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-heading)" }}>
              Create student account
            </h1>
            <p style={{ color: "var(--muted)" }} className="text-xs sm:text-sm mt-1 max-w-xs">
              Exclusively for Addis Ababa University students with verified institutional email
            </p>
          </div>

          {state.status === "error" && (
            <div 
              role="alert" 
              aria-live="assertive" 
              className="mb-5 p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{state.message}</span>
            </div>
          )}
          {state.status === "success" && (
            <div 
              role="status" 
              aria-live="polite" 
              className="mb-5 p-3.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl font-medium flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{state.message}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Hidden gender field */}
            <input type="hidden" name="gender" value={gender} />

            {/* ── Visual Gender Picker ───────────────────────────────── */}
            <div className="space-y-2">
              <Label id="gender-picker-label" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Theme Profile
              </Label>
              <div role="radiogroup" aria-labelledby="gender-picker-label" className="grid grid-cols-2 gap-3">
                <GenderCard gender="MALE" selected={gender === "MALE"} onClick={() => setGender("MALE")} />
                <GenderCard gender="FEMALE" selected={gender === "FEMALE"} onClick={() => setGender("FEMALE")} />
              </div>
              <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
                Personalizes your aesthetic color theme and student avatar
              </p>
            </div>

            {/* University Field (AAU Verified Exclusive) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="universityId" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Institution
                </Label>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Pilot
                </span>
              </div>
              <div className="relative">
                <select
                  id="universityId"
                  name="universityId"
                  required
                  defaultValue={universities[0]?.id || ""}
                  className="flex h-12 w-full rounded-xl border border-zinc-200/80 dark:border-white/10 px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer bg-zinc-50/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                >
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.domain})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Institutional Email
                </Label>
                <span className="text-[11px] font-medium text-zinc-400">@aau.edu.et</span>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="username@aau.edu.et"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-800/60 px-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pl-0.5">
                Must end with official institutional domain (@aau.edu.et).
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Password
                </Label>
                <span className={`text-[11px] font-medium transition-colors ${password.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                  {password.length >= 8 ? "✓ 8+ characters" : "Min 8 characters"}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="h-12 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-800/60 px-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1.5 h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                minLength={8}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-800/60 px-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>

            <Button
              type="submit"
              className="mt-3 w-full h-12 text-sm font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              size="lg"
              disabled={isPending}
              style={{ 
                backgroundColor: "var(--theme-accent)",
                color: "#fff",
                boxShadow: "0 6px 24px color-mix(in srgb, var(--theme-accent) 35%, transparent)"
              }}
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating AAU account...
                </span>
              ) : (
                "Create Verified Account"
              )}
            </Button>
          </form>

          <div className="text-center text-xs sm:text-sm mt-6 text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline transition-colors" style={{ color: "var(--theme-accent)" }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
