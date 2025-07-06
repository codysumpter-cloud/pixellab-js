import { z } from "zod";

export interface Usage {
  type: "usd";
  usd: number;
}

export const UsageSchema = z.object({
  type: z.literal("usd"),
  usd: z.number(),
});