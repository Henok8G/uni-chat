"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail, Heart } from 'lucide-react';

const FacebookIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export const InteractiveFooter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Simulate a 70% success rate
    const success = Math.random() > 0.3;

    setSubscriptionStatus(success ? 'success' : 'error');
    setIsSubmitting(false);

    if (success) {
      setEmail('');
    }

    // Reset the status message after 3 seconds
    setTimeout(() => {
      setSubscriptionStatus('idle');
    }, 3000);
  };

  const popAnimation = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  };

  const textPopAnimation = {
    whileHover: { scale: 1.05, originX: 0, color: "#10b981" }, // emerald-500
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  };

  return (
    <footer className="relative z-20 w-full backdrop-blur-md border-t transition-colors" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="container mx-auto grid grid-cols-1 gap-12 px-6 py-20 md:grid-cols-2 lg:grid-cols-4">
        {/* Company Info */}
        <div className="flex flex-col items-start gap-4">
          <motion.div className="flex items-center gap-3 cursor-pointer" {...popAnimation}>
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xl"
              style={{ backgroundColor: "var(--theme-accent)" }}
            >
              U
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-heading)" }}>Uni-Chat</span>
          </motion.div>
          <motion.p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }} {...popAnimation}>
            Empowering students with strictly verified, high-quality video connections across Ethiopian Universities.
          </motion.p>
        </div>

        {/* Useful Links */}
        <div className="md:justify-self-center">
          <motion.h3 className="mb-6 text-lg font-semibold tracking-tight" style={{ color: "var(--text-heading)" }} {...popAnimation}>Quick Links</motion.h3>
          <ul className="space-y-4">
            {[
              { label: 'About Us', href: '#' },
              { label: 'Safety Hub', href: '#' },
              { label: 'Contact Support', href: '#' },
              { label: 'Privacy Policy', href: '#' },
            ].map((link) => (
              <li key={link.label}>
                <motion.a
                  href={link.href}
                  className="inline-block text-sm transition-colors"
                  style={{ color: "var(--muted)" }}
                  {...textPopAnimation}
                >
                  {link.label}
                </motion.a>
              </li>
            ))}
          </ul>
        </div>

        {/* Follow Us */}
        <div className="md:justify-self-center">
          <motion.h3 className="mb-6 text-lg font-semibold tracking-tight" style={{ color: "var(--text-heading)" }} {...popAnimation}>Connect</motion.h3>
          <ul className="space-y-4">
            {[
              { label: 'Facebook', href: '#', icon: <FacebookIcon className="w-5 h-5" /> },
              { label: 'Instagram', href: '#', icon: <InstagramIcon className="w-5 h-5" /> },
              { label: 'Twitter (X)', href: '#', icon: <XIcon className="w-5 h-5" /> },
            ].map((link) => (
              <li key={link.label}>
                <motion.a
                  href={link.href}
                  aria-label={link.label}
                  className="flex items-center gap-3 text-sm transition-colors inline-flex"
                  style={{ color: "var(--muted)" }}
                  {...textPopAnimation}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </motion.a>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <motion.h3 className="mb-6 text-lg font-semibold tracking-tight" style={{ color: "var(--text-heading)" }} {...popAnimation}>Join our Newsletter</motion.h3>
          <form onSubmit={handleSubscribe} className="relative w-full max-w-sm">
            <div className="relative flex items-center">
              <Input
                type="email"
                placeholder="university@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || subscriptionStatus !== 'idle'}
                required
                aria-label="Email for newsletter"
                className="pr-28 h-12 rounded-xl transition-colors"
                style={{ 
                  backgroundColor: "var(--surface)", 
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)"
                }}
              />
              <motion.div className="absolute right-1" {...popAnimation}>
                <Button
                  type="submit"
                  disabled={isSubmitting || subscriptionStatus !== 'idle'}
                  className="h-10 rounded-lg px-4 text-white font-semibold"
                  style={{ backgroundColor: "var(--theme-accent)" }}
                >
                  {isSubmitting ? 'Wait...' : 'Subscribe'}
                </Button>
              </motion.div>
            </div>
            
            {/* Advanced Animation Overlay */}
            {subscriptionStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex items-center justify-center rounded-xl text-center backdrop-blur-md border shadow-sm"
                style={{ 
                  backgroundColor: "var(--surface)", 
                  borderColor: "var(--card-border)" 
                }}
              >
                {subscriptionStatus === 'success' ? (
                  <span className="font-semibold flex items-center gap-2" style={{ color: "var(--theme-accent)" }}>
                    <Mail className="w-4 h-4"/> Subscribed! 🎉
                  </span>
                ) : (
                  <span className="font-semibold text-red-500 flex items-center gap-2">
                    Failed. Try again.
                  </span>
                )}
              </motion.div>
            )}
          </form>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--card-border)" }}>
         <motion.div className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--muted)" }} {...popAnimation}>
            © 2026 Ethi-Uni-Chat. All rights reserved.
         </motion.div>
         <motion.div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }} {...popAnimation}>
            Crafted with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by You
         </motion.div>
      </div>
    </footer>
  );
};
