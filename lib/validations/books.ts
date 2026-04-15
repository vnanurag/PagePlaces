import { z } from "zod"

export const createUserBookSchema = z.object({
  googleId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  publishedAt: z.string().optional(),
  authorName: z.string().min(1, "Author name is required"),
  authorGoogleId: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
})

export const addLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  locationType: z.enum(["PURCHASED", "RECEIVED", "GIFTED", "READ", "OTHER"]),
})

export const updateUserBookSchema = z.object({
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
})

export type CreateUserBookInput = z.infer<typeof createUserBookSchema>
export type AddLocationInput = z.infer<typeof addLocationSchema>
export type UpdateUserBookInput = z.infer<typeof updateUserBookSchema>
