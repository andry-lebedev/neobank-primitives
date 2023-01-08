import { z } from 'zod'

// Guard for AI edits to src/brand.config.ts: a malformed config fails the
// test suite fast with a readable zod error instead of breaking the UI.
export const brandSchema = z.object({
  name: z.string().min(1),
  tagline: z.string(),
  logoSrc: z.string().min(1),
  greeting: z.string().min(1),
  locale: z.string().min(2),
  currency: z.string().length(3),
  features: z.object({
    send: z.boolean(),
    addMoney: z.boolean(),
    activity: z.boolean(),
    profile: z.boolean(),
    onboarding: z.boolean(),
  }),
  explainerDefaultOn: z.boolean(),
})

export type BrandConfig = z.infer<typeof brandSchema>
