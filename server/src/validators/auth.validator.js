import { z } from "zod";

export const devLoginSchema = z.object({
    email: z.email().trim().toLowerCase(),
});
