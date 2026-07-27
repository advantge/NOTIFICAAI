import { z } from "zod";

const linkSchema = z.object({
  rel: z.string(),
  href: z.string().url(),
  media: z.string(),
  type: z.string(),
});

export const pagBankOrderSchema = z.object({
  id: z.string().min(1),
  reference_id: z.string().optional(),
  qr_codes: z
    .array(
      z.object({
        id: z.string().min(1),
        amount: z.object({ value: z.number().int().nonnegative() }),
        text: z.string().min(1),
        expiration_date: z.string().optional(),
        links: z.array(linkSchema).default([]),
      }),
    )
    .default([]),
  charges: z
    .array(
      z.object({
        id: z.string(),
        reference_id: z.string().optional(),
        status: z.string(),
        created_at: z.string().optional(),
        paid_at: z.string().optional(),
        amount: z.object({
          value: z.number().int(),
          currency: z.string().default("BRL"),
        }),
      }),
    )
    .default([]),
});

export type PagBankOrder = z.infer<typeof pagBankOrderSchema>;
