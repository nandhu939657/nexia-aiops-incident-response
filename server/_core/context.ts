import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getSupabaseUserFromToken } from "./supabaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function getBearerToken(req: CreateExpressContextOptions["req"]): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) return header.slice(7);
  return undefined;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = getBearerToken(opts.req);
    const supabaseUser = token ? await getSupabaseUserFromToken(token) : null;

    if (supabaseUser) {
      user = (await db.getUserByOpenId(supabaseUser.id)) ?? null;
      if (!user) {
        await db.upsertUser({
          openId: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.name,
          loginMethod: "supabase",
          lastSignedIn: new Date(),
        });
        user = (await db.getUserByOpenId(supabaseUser.id)) ?? null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
