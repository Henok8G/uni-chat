import { Plan } from '@prisma/client';

export function hasActivePaidPlan(user: { plan: Plan; planExpiresAt: Date | null } | null): boolean {
  if (!user) return false;
  if (user.plan === 'FREE') return false;
  if (!user.planExpiresAt) return false;
  return user.planExpiresAt > new Date();
}
