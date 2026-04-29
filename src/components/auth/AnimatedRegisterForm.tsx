"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";

// --- Pupil & EyeBall Reusable Components ---
interface PupilProps {
  size?: number; maxDistance?: number; pupilColor?: string; forceLookX?: number; forceLookY?: number;
}
const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
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
    <div ref={pupilRef} className="rounded-full" style={{ width: `${size}px`, height: `${size}px`, backgroundColor: pupilColor, transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`, transition: 'transform 0.1s ease-out' }} />
  );
};
interface EyeBallProps {
  size?: number; pupilSize?: number; maxDistance?: number; eyeColor?: string; pupilColor?: string; isBlinking?: boolean; forceLookX?: number; forceLookY?: number;
}
const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
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
    <div ref={eyeRef} className="rounded-full flex items-center justify-center transition-all duration-150" style={{ width: `${size}px`, height: isBlinking ? '2px' : `${size}px`, backgroundColor: eyeColor, overflow: 'hidden' }}>
      {!isBlinking && (
        <div className="rounded-full" style={{ width: `${pupilSize}px`, height: `${pupilSize}px`, backgroundColor: pupilColor, transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`, transition: 'transform 0.1s ease-out' }} />
      )}
    </div>
  );
};

// --- Visual Gender Card ---
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
        emoji: "👨‍🎓",
        description: "Steel blue · Powder · Sage",
        bg: "from-blue-50 to-slate-100 dark:from-blue-900/20 dark:to-slate-800/20",
        border: "border-blue-400 dark:border-blue-800",
        ring: "ring-blue-300 dark:ring-blue-800",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        dot: "bg-blue-400 dark:bg-blue-500",
        swatches: ["#B0C4DE", "#B0E0E6", "#98FB98", "#E6E6FA", "#778899"],
      }
    : {
        label: "Female",
        emoji: "👩‍🎓",
        description: "Blush · Peach · Lavender",
        bg: "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-800/20",
        border: "border-pink-400 dark:border-pink-800",
        ring: "ring-pink-300 dark:ring-pink-800",
        badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
        dot: "bg-pink-400 dark:bg-pink-500",
        swatches: ["#FFB3BA", "#FFA07A", "#F5DEB3", "#D8BFD8", "#E6E6FA"],
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 w-full
        transition-all duration-300 text-left
        bg-gradient-to-br ${config.bg}
        ${selected
          ? `${config.border} shadow-lg ring-2 ${config.ring} scale-[1.03]`
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.01]"
        }
      `}
    >
      {/* Checkmark */}
      <div className={`
        absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
        transition-all duration-200
        ${selected ? `${config.dot} border-transparent` : "border-zinc-600"}
      `}>
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Avatar emoji */}
      <div className="text-4xl">{config.emoji}</div>

      {/* Label */}
      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${config.badge}`}>
        {config.label}
      </span>

      {/* Description */}
      <span className="text-xs text-zinc-400 text-center">{config.description}</span>

      {/* Color swatches */}
      <div className="flex gap-1.5 mt-1">
        {config.swatches.map((c) => (
          <div
            key={c}
            className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
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
    const handleMouseMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
          <div 
            className="size-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent) 20%, transparent)" }}
          >
            <Sparkles className="size-4" style={{ color: "var(--theme-accent)" }} />
          </div>
          <span>Ethi-Uni-Chat</span>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[550px]">
          {/* Cartoon Characters Container */}
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            {/* Purple Character */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '70px', width: '180px', height: (isTyping || (password.length > 0 && !showPassword)) ? '460px' : '400px', backgroundColor: '#B0C4DE', borderRadius: '10px 10px 0 0', zIndex: 1, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${purplePos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{ left: (password.length > 0 && showPassword) ? `20px` : isLookingAtEachOther ? `55px` : `${45 + purplePos.faceX}px`, top: (password.length > 0 && showPassword) ? `35px` : isLookingAtEachOther ? `65px` : `${40 + purplePos.faceY}px` }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* Black Character */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '240px', width: '120px', height: '330px', backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : isLookingAtEachOther ? `skewX(${(blackPos.bodySkew) * 1.5 + 10}deg) translateX(20px)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(blackPos.bodySkew) * 1.5}deg)` : `skewX(${blackPos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{ left: (password.length > 0 && showPassword) ? `10px` : isLookingAtEachOther ? `32px` : `${26 + blackPos.faceX}px`, top: (password.length > 0 && showPassword) ? `28px` : isLookingAtEachOther ? `12px` : `${32 + blackPos.faceY}px` }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* Orange Character */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '0px', width: '240px', height: '200px', backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0', zIndex: 3, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-8 transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `50px` : `${82 + orangePos.faceX}px`, top: (password.length > 0 && showPassword) ? `85px` : `${90 + orangePos.faceY}px` }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow Character */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: '310px', width: '140px', height: '230px', backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-6 transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `20px` : `${52 + yellowPos.faceX}px`, top: (password.length > 0 && showPassword) ? `35px` : `${40 + yellowPos.faceY}px` }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
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
      <div className="flex items-center justify-center p-8 transition-colors py-16" style={{ backgroundColor: "var(--background)" }}>
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12" style={{ color: "var(--foreground)" }}>
            <div 
              className="size-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent) 20%, transparent)" }}
            >
              <Sparkles className="size-4" style={{ color: "var(--theme-accent)" }} />
            </div>
            <span>Ethi-Uni-Chat</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-heading)" }}>Create an account</h1>
            <p style={{ color: "var(--muted)" }} className="text-sm">Join using your university email address</p>
          </div>

          {state.status === "error" && (
            <div className="mb-6 p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
              {state.message}
            </div>
          )}
          {state.status === "success" && (
            <div className="mb-6 p-3 text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Hidden gender field */}
            <input type="hidden" name="gender" value={gender} />

            {/* ── Visual Gender Picker ───────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium transition-colors" style={{ color: "var(--text-heading)" }}>I identify as</Label>
              <div className="grid grid-cols-2 gap-3">
                <GenderCard gender="MALE" selected={gender === "MALE"} onClick={() => setGender("MALE")} />
                <GenderCard gender="FEMALE" selected={gender === "FEMALE"} onClick={() => setGender("FEMALE")} />
              </div>
              <p className="text-[11px] text-center mt-1" style={{ color: "var(--muted)" }}>
                This picks your personal color theme 🎨
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="universityId" className="text-sm font-medium transition-colors" style={{ color: "var(--text-heading)" }}>University</Label>
              <select
                id="universityId"
                name="universityId"
                required
                className="flex h-12 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  backgroundColor: "var(--surface)", 
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)"
                }}
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name} ({uni.domain})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium transition-colors" style={{ color: "var(--text-heading)" }}>University Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@aau.edu.et"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12 transition-colors"
                style={{ 
                  backgroundColor: "var(--surface)", 
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium transition-colors" style={{ color: "var(--text-heading)" }}>Password</Label>
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
                  className="h-12 pr-10 transition-colors"
                  style={{ 
                    backgroundColor: "var(--surface)", 
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  {showPassword ? <EyeOff className="size-5 hover:text-[var(--foreground)]" /> : <Eye className="size-5 hover:text-[var(--foreground)]" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium transition-colors" style={{ color: "var(--text-heading)" }}>Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                minLength={8}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12 transition-colors"
                style={{ 
                  backgroundColor: "var(--surface)", 
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            <Button
              type="submit"
              className="mt-2 w-full h-12 text-base font-semibold shadow-lg transition-all"
              size="lg"
              disabled={isPending}
              style={{ 
                backgroundColor: "var(--theme-accent)",
                color: "#fff",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--theme-accent) 30%, transparent)"
              }}
            >
              {isPending ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="text-center text-sm mt-6 transition-colors" style={{ color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "var(--theme-accent)" }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
