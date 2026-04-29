'use client';
import React from 'react';
import { PlusIcon, ShieldCheckIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { BorderTrail } from './ui/border-trail';
import { plans, TELEGRAM_HANDLE } from '@/config/pricingConfig';

interface PricingSectionProps {
  currentPlan: string;
  accentColor?: string;
  isPublic?: boolean;
}

export function PricingSection({ currentPlan, accentColor = '#B0C4DE', isPublic = false }: PricingSectionProps) {
  const telegramUrl = `https://t.me/${TELEGRAM_HANDLE.replace('@', '')}`;

  return (
    <section className="relative overflow-hidden py-12">
      <div id="pricing" className="mx-auto w-full max-w-6xl space-y-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl space-y-4"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-zinc-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Pricing Options
            </div>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Choose Your Experience
          </h2>
          <p className="text-center text-lg text-zinc-600 dark:text-zinc-400">
            Select the plan that fits your social journey. All new accounts start with a 20-day free trial.
          </p>
        </motion.div>

        <div className="relative">
          {/* Grid background effect */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 -z-10 size-full',
              'bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)]',
              'bg-[size:32px_32px]',
              '[mask-image:radial-gradient(ellipse_at_center,white_20%,transparent)]',
              'dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]'
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {/* Free Trial Card */}
            <div className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 transition-all dark:bg-zinc-950",
              currentPlan === 'FREE' ? "ring-1" : "border-zinc-200"
            )} style={currentPlan === 'FREE' ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` } : {}}>
              <PlusIcon className="absolute -top-1.5 -left-1.5 size-4 text-zinc-300" />
              <PlusIcon className="absolute -top-1.5 -right-1.5 size-4 text-zinc-300" />
              <PlusIcon className="absolute -bottom-1.5 -left-1.5 size-4 text-zinc-300" />
              <PlusIcon className="absolute -right-1.5 -bottom-1.5 size-4 text-zinc-300" />
              
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plans.FREE.label}</h3>
                  {currentPlan === 'FREE' && (
                    <Badge variant="secondary" className="opacity-80" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                      Current
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">20</span>
                  <span className="text-xl font-medium text-zinc-500">Days</span>
                </div>
                <p className="mt-2 text-sm font-semibold" style={{ color: accentColor }}>Free Trial</p>
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {plans.FREE.description}
                </p>
              </div>
              <div className="mt-8">
                <Button className="w-full" variant="outline" asChild>
                  {isPublic ? (
                    <a href="/auth/register">Start Free Trial</a>
                  ) : (
                    <a href="/app">{currentPlan === 'FREE' ? "Continue to App" : "Continue to App"}</a>
                  )}
                </Button>
              </div>
            </div>

            {/* Standard Card */}
            <div className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 transition-all dark:bg-zinc-950",
              currentPlan === 'STANDARD' ? "ring-1" : "border-zinc-200 shadow-sm"
            )} style={currentPlan === 'STANDARD' ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` } : {}}>
              <PlusIcon className="absolute -top-1.5 -left-1.5 size-4 text-zinc-300" />
              <PlusIcon className="absolute -top-1.5 -right-1.5 size-4 text-zinc-300" />
              <PlusIcon className="absolute -bottom-1.5 -left-1.5 size-4 text-zinc-300" />
              <PlusIcon className="absolute -right-1.5 -bottom-1.5 size-4 text-zinc-300" />

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plans.STANDARD.label}</h3>
                  {currentPlan === 'STANDARD' && (
                    <Badge variant="secondary" className="opacity-80" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                      Current
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">350</span>
                  <span className="text-xl font-medium text-zinc-500">ETB</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-500">Per month</p>
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {plans.STANDARD.description}
                </p>
              </div>
              <div className="mt-8">
                <Button className="w-full" variant="outline" asChild>
                  {isPublic ? (
                    <a href="/auth/register">Upgrade Now and Get Pro</a>
                  ) : (
                    <a href={telegramUrl} target="_blank" rel="noreferrer">Upgrade Now and Get Pro</a>
                  )}
                </Button>
              </div>
            </div>

            {/* Pro Card (with BorderTrail) */}
            <div className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 transition-all dark:bg-zinc-950 shadow-lg",
              currentPlan === 'PRO' ? "ring-1" : "border-zinc-900"
            )} style={currentPlan === 'PRO' ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` } : {}}>
              {currentPlan !== 'PRO' && (
                <BorderTrail
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0px 0px 15px 5px ${accentColor}66`,
                  }}
                  size={120}
                />
              )}
              
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plans.PRO.label}</h3>
                    <Sparkles className="size-4" style={{ color: accentColor }} />
                  </div>
                  {currentPlan === 'PRO' && (
                    <Badge variant="secondary" className="opacity-80" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                      Current
                    </Badge>
                  )}
                  {currentPlan !== 'PRO' && (
                    <Badge style={{ backgroundColor: accentColor, color: '#fff' }}>Popular</Badge>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1 text-zinc-900 dark:text-zinc-50">
                  <span className="text-4xl font-extrabold tracking-tight">1000</span>
                  <span className="text-xl font-medium text-zinc-500">ETB</span>
                </div>
                <p className="mt-2 text-sm font-semibold" style={{ color: accentColor }}>Per month</p>
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {plans.PRO.description}
                </p>
              </div>
              <div className="mt-8">
                <Button className="w-full text-white" style={{ backgroundColor: accentColor }} asChild>
                  {isPublic ? (
                    <a href="/auth/register">Upgrade Now and Get Pro</a>
                  ) : (
                    <a href={telegramUrl} target="_blank" rel="noreferrer">Upgrade Now and Get Pro</a>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-x-2 text-sm text-zinc-500 dark:text-zinc-400">
              <ShieldCheckIcon className="size-4 text-emerald-500" />
              <span>Secure payments handled via Telegram concierge</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
