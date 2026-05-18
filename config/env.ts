import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET là bắt buộc"),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL phải là URL hợp lệ"),

  },

  client: {
    NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL phải là URL hợp lệ"),
    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL phải là URL hợp lệ"),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
