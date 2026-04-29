import { Plan } from '@prisma/client';

export function hasActivePlan(user: { plan: Plan; planExpiresAt: Date | null } | null): boolean {
  if (!user) return false;
  // If no expiration is set, we assume it's an old user or a plan that doesn't expire yet.
  // But based on the new requirements, all new FREE plans will have an expiration.
  if (!user.planExpiresAt) return true; 
  return user.planExpiresAt > new Date();
}
