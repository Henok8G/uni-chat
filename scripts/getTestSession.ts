import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { SignJWT } from "jose";

async function main() {
  const user = await prisma.user.findFirst({
    where: { emailVerified: true, banned: false },
    select: { id: true, email: true, role: true, displayName: true },
  });

  if (!user) {
    console.log("NO_USER");
    return;
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is missing");
  const secretKey = new TextEncoder().encode(secret);

  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  console.log("USER_EMAIL:" + user.email);
  console.log("USER_ID:" + user.id);
  console.log("SESSION_TOKEN:" + token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
