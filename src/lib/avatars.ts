/**
 * High-Quality Student Avatars System
 * 
 * Sliced and optimized from the official AAU Uni-Chat avatar collection.
 * 30 Male avatars + 30 Female avatars (256x256 high-resolution with alpha transparency).
 */

export const MALE_AVATARS: string[] = Array.from({ length: 30 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return `/avatars/male/male-${num}.png`;
});

export const FEMALE_AVATARS: string[] = Array.from({ length: 30 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return `/avatars/female/female-${num}.png`;
});

export const ALL_AVATARS: string[] = [...MALE_AVATARS, ...FEMALE_AVATARS];

/**
 * Returns the relevant pool of avatars based on gender.
 */
export function getAvatarPool(gender?: string | null): string[] {
  const g = (gender || "").toUpperCase();
  if (g === "MALE") return MALE_AVATARS;
  if (g === "FEMALE") return FEMALE_AVATARS;
  return ALL_AVATARS;
}

/**
 * Deterministically pick an avatar from a seed string (e.g. userId, email, or name).
 * Ensures the user sees the same assigned avatar on every reload.
 */
export function getDeterministicAvatar(seed: string, gender?: string | null): string {
  const pool = getAvatarPool(gender);
  if (!pool.length) return "/avatars/male/male-01.png";

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * Selects a random avatar from the gender-specific collection.
 */
export function getRandomAvatar(gender?: string | null): string {
  const pool = getAvatarPool(gender);
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export interface AvatarResolvableUser {
  id?: string | null;
  email?: string | null;
  gender?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

/**
 * Resolves the appropriate avatar URL for a user.
 * 
 * Rules:
 * 1. If user has an explicitly saved `avatarUrl`, return it.
 * 2. If user is a verified student (`emailVerified === true` and role === 'STUDENT' or undefined),
 *    returns their assigned gender-specific avatar from the 60-avatar collection.
 * 3. Fallback for unverified users: Dicebear adventurer or deterministic initial avatar.
 */
export function resolveUserAvatar(user?: AvatarResolvableUser | null): string {
  if (!user) return "/avatars/male/male-01.png";

  // 1. Explicitly saved avatar
  if (user.avatarUrl && user.avatarUrl.trim() !== "") {
    return user.avatarUrl;
  }

  // 2. Verified student -> assign gender-specific avatar from collection
  const isStudent = !user.role || user.role === "STUDENT";
  const isVerified = Boolean(user.emailVerified);

  if (isVerified && isStudent) {
    const seed = user.id || user.email || user.displayName || "verified-student";
    return getDeterministicAvatar(seed, user.gender);
  }

  // 3. Unverified fallback or pending verification
  const safeSeed = encodeURIComponent(user.displayName || user.email?.split("@")[0] || "User");
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${safeSeed}`;
}
