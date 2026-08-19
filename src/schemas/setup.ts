import { z } from "zod";

export const schoolInfoSchema = z.object({
  name: z.string().min(2, "School name is required (at least 2 characters)"),
  code: z
    .string()
    .min(2, "School code must be at least 2 characters")
    .max(12, "School code cannot exceed 12 characters")
    .regex(/^[A-Z0-9_-]+$/, "School code must be uppercase alphanumeric without spaces"),
  principalName: z.string().optional().or(z.literal("")),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().min(7, "Valid phone number required").optional().or(z.literal("")),
  alternatePhone: z.string().optional().or(z.literal("")),
  website: z.string().url("Valid URL required e.g. https://yourschool.com").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  country: z.string().default("India"),
});

export type SchoolInfoInput = z.infer<typeof schoolInfoSchema>;

export const brandingSchema = z.object({
  displayName: z.string().optional().or(z.literal("")),
  primaryColor: z.string().default("#1E40AF"),
  secondaryColor: z.string().default("#F59E0B"),
  logoUrl: z.string().optional().or(z.literal("")),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
