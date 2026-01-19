import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { launch } from "@/lib/db/auth-schema";

/**
 * Server-side helper to fetch a launch by either internal ID (UUID) or tokenMint (Solana address).
 * Used by server components that need direct DB access for metadata generation.
 */
export async function getLaunchByIdOrMint(idOrMint: string) {
  const isUUID = idOrMint.includes("-") && idOrMint.length === 36;
  const condition = isUUID
    ? eq(launch.id, idOrMint)
    : eq(launch.tokenMint, idOrMint);

  const [result] = await db.select().from(launch).where(condition).limit(1);

  return result ?? null;
}
