"use client";

import type { FC } from "react";
import { Check } from "lucide-react";

interface UserInfoProps {
  className?: string;
  name: string;
  bio?: string | null;
  avatarUrl: string;
  avatarFallback: string;
  onDetailsClick?: () => void;
}

const UserInfo: FC<UserInfoProps> = ({ className = "", name, bio, avatarUrl, avatarFallback, onDetailsClick }) => {
  return (
    <section
      className={`w-full shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] rounded-[28px] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,rgba(24,24,31,0.82))] dark:backdrop-blur-xl dark:border dark:border-white/10 border-[#e2e8f0] border-solid border-[1px] box-border flex items-center pt-6 px-6 sm:px-9 pb-6 relative isolate gap-6 sm:gap-8 max-w-full text-left text-zinc-900 dark:text-zinc-100 font-sf-pro mq1050:flex-wrap transition-all duration-300 card-float ${className}`}
    >
      {/* Avatar */}
      <div className="flex flex-col items-start shrink-0">
        <div className="relative">
          <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border-[5px] border-white dark:border-zinc-800 overflow-hidden bg-gradient-to-br from-[#e8edf5] to-[#d5def2]">
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "flex";
              }}
            />
            {/* Fallback initial */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#6b7ff0] to-[#5b8dee] items-center justify-center text-[40px] font-bold text-white"
              style={{ display: "none" }}
            >
              {avatarFallback}
            </div>
          </div>

          {/* Small verified badge */}
          <div className="absolute bottom-0.5 right-0.5 w-8 h-8 bg-[#3b82f6] rounded-full border-[3px] border-white dark:border-zinc-800 flex items-center justify-center shadow-md">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="flex flex-col items-start gap-3 flex-1 min-w-[200px]">
        <h2 className="m-0 text-[28px] font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">{name}</h2>

        {/* Bio or placeholder */}
        <div className="w-full max-w-[500px] text-[15px] font-medium leading-relaxed">
          {bio ? (
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed m-0">{bio}</p>
          ) : (
            <span className="italic text-zinc-400 dark:text-zinc-500 text-[14px]">No bio added yet.</span>
          )}
        </div>

        <button
          type="button"
          onClick={onDetailsClick}
          className="cursor-pointer py-2 px-9 rounded-full flex items-center justify-center group bg-white/30 dark:bg-white/10 backdrop-blur-[10px] border-[1px] border-[rgba(255,255,255,0.2)] dark:border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)] hover:bg-white/40 dark:hover:bg-white/15 btn-lift transition-all"
        >
          <span className="text-[15px] font-medium text-[#15161c] dark:text-zinc-100">Details</span>
        </button>
      </div>

      {/* NOTE: Big scalloped verified badge removed intentionally */}
    </section>
  );
};

export default UserInfo;
