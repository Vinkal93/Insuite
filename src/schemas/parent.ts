import { z } from "zod";

export const parentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"]),
  mobile: z.string().min(10, "Valid mobile number is required"),
  alternateMobile: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  occupation: z.string().optional(),
  address: z.string().optional(),
});

export type ParentFormInput = z.infer<typeof parentSchema>;
