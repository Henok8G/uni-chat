'use client';
import React from 'react';
import { Check } from 'lucide-react';
import { TELEGRAM_HANDLE } from '@/config/pricingConfig';

interface PricingSectionProps {
  currentPlan?: string;
  accentColor?: string;
  isPublic?: boolean;
}

export function PricingSection({ currentPlan = 'FREE', accentColor, isPublic = false }: PricingSectionProps) {
  const telegramUrl = `https://t.me/${TELEGRAM_HANDLE.replace('@', '')}`;
  const isFreeCurrent = currentPlan.toUpperCase() === 'FREE';
  const isStandardCurrent = currentPlan.toUpperCase() === 'STANDARD';
  const isProCurrent = currentPlan.toUpperCase() === 'PRO';

  return (
    <section className="w-full font-sans text-[#111827] dark:text-white">
      <div className="max-w-[1100px] mx-auto pt-10 pb-20 px-4 md:px-8">
        
        <h1 className="text-[40px] leading-tight font-medium mb-6 text-[var(--foreground)]">Plans</h1>
        
        <h2 className="text-[28px] leading-tight font-medium mb-4 text-[var(--foreground)]">Your Campus Plan &amp; Upgrades</h2>
        
        <p className="text-[15px] text-[var(--muted)] max-w-4xl mb-16 leading-relaxed font-medium">
          Select a plan tailored to your university communication needs. Verified Addis Ababa University students receive full campus access during our active semester pilot, including peer discovery, campus feeds, and real-time audio/video matching.
        </p>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch justify-center">
          
          {/* Free Card */}
          <div className="flex-1 bg-white dark:bg-[rgba(24,24,31,0.82)] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-3xl p-8 flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_40px_-6px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
            <h3 className="text-[32px] font-medium mb-6 text-[var(--foreground)]">Free</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[40px] leading-none font-medium text-[var(--foreground)]">0</span>
              <span className="text-[14px] font-medium text-[var(--foreground)] uppercase">ETB</span>
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-[13px] font-semibold mb-8">
              {isFreeCurrent ? 'Current Active Plan' : 'Base Student Tier'}
            </p>
            
            <ul className="space-y-3 mb-10 flex-1">
              {[
                'Verified AAU student directory access',
                'Campus feed, events & announcements',
                'Random 1-on-1 video & audio matching',
                'Direct messaging & mutual friend requests'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14.5px] font-medium text-[var(--foreground)]">
                  <Check className="w-[18px] h-[18px] mt-[1px] shrink-0" strokeWidth={3} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex justify-center mt-auto">
              <button 
                type="button"
                disabled={isFreeCurrent}
                className="w-[80%] py-3 rounded-full bg-[#e8e9ec] dark:bg-white/10 text-slate-700 dark:text-[#aab0c0] text-[14px] font-medium transition-colors"
              >
                {isFreeCurrent ? 'Current plan' : 'Base Included'}
              </button>
            </div>
          </div>

          {/* Standard Card */}
          <div className="flex-1 bg-white dark:bg-[rgba(24,24,31,0.82)] dark:backdrop-blur-xl rounded-3xl p-8 flex flex-col border border-blue-500/50 dark:border-blue-400/40 shadow-[0_8px_25px_-5px_rgba(59,130,246,0.25)] dark:shadow-[0_8px_40px_-5px_rgba(59,130,246,0.15)] relative lg:-mt-4 transition-all duration-300 hover:shadow-[0_12px_35px_-5px_rgba(59,130,246,0.35)] dark:hover:shadow-[0_12px_40px_-5px_rgba(59,130,246,0.25)] hover:-translate-y-1">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-1.5 rounded-full text-[13px] font-semibold tracking-wide shadow-sm">
              Popular
            </div>
            <h3 className="text-[32px] font-medium mb-6 text-[var(--foreground)]">Standard</h3>
            <div className="flex items-baseline gap-2 mb-12">
              <span className="text-[40px] leading-none font-medium text-[var(--foreground)]">350</span>
              <span className="text-[14px] font-medium text-[var(--foreground)] uppercase">ETB / Mon</span>
            </div>
            
            <ul className="space-y-3 mb-10 flex-1">
              {[
                'Everything in Free',
                'Unlimited direct messaging sessions',
                'Department & interest-based discovery filters',
                'Participation in student study groups & clubs'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14.5px] font-medium text-[var(--foreground)]">
                  <Check className="w-[18px] h-[18px] mt-[1px] shrink-0" strokeWidth={3} />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex justify-center mt-auto">
              {isStandardCurrent ? (
                <button 
                  type="button"
                  disabled
                  className="w-[80%] py-3 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[14px] font-semibold"
                >
                  Current plan
                </button>
              ) : (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[80%] py-3 rounded-full border-2 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-300 text-[14px] font-semibold transition-colors hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-center inline-block"
                >
                  Upgrade via Telegram
                </a>
              )}
            </div>
          </div>

          {/* Pro Card */}
          <div className="flex-1 bg-white dark:bg-[rgba(24,24,31,0.82)] dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-3xl p-8 flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_40px_-6px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
            <h3 className="text-[32px] font-medium mb-6 text-[var(--foreground)]">Pro</h3>
            <div className="flex items-baseline gap-2 mb-12">
              <span className="text-[40px] leading-none font-medium text-[var(--foreground)]">1000</span>
              <span className="text-[14px] font-medium text-[var(--foreground)] uppercase">ETB / Mon</span>
            </div>
            
            <ul className="space-y-3 mb-10 flex-1">
              {[
                'Everything in Standard',
                'Gender-priority video matching queue',
                'Department & senior cohort pairing preference',
                'Enhanced campus discovery radar priority'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14.5px] font-medium text-[var(--foreground)]">
                  <Check className="w-[18px] h-[18px] mt-[1px] shrink-0" strokeWidth={3} />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex justify-center mt-auto">
              {isProCurrent ? (
                <button 
                  type="button"
                  disabled
                  className="w-[80%] py-3 rounded-full bg-[#d6e0f0] dark:bg-white/10 text-[#55698b] dark:text-[#aab0c0] text-[14px] font-medium"
                >
                  Current plan
                </button>
              ) : (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[80%] py-3 rounded-full bg-[#d6e0f0] dark:bg-white/10 text-[#55698b] dark:text-[#aab0c0] text-[14px] font-medium transition-colors hover:bg-[#c2d0e6] dark:hover:bg-white/15 text-center inline-block"
                >
                  Upgrade via Telegram
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Clear Disclosure */}
        <div className="mt-12 text-center text-xs text-[var(--muted)] max-w-xl mx-auto space-y-1.5">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Account upgrades and institutional inquiries are coordinated directly with campus platform administration via Telegram ({TELEGRAM_HANDLE}).
          </p>
          <p>
            Automated in-app payment processing is not yet enabled for Ethiopian banking rails. Free pilot access is active for all verified AAU university accounts (@aau.edu.et).
          </p>
        </div>
      </div>
    </section>
  );
}
