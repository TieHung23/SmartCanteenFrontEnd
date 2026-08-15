import { z } from "zod";

const VIETNAMESE_PHONE_REGEX = /^((\+84)|0)(3|5|7|8|9)+([0-8]{1})\d{7}$/;

const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((v) => /[A-Z]/.test(v), "Password must contain at least one uppercase letter.")
  .refine((v) => /\d/.test(v), "Password must contain at least one digit.")
  .refine(
    (v) => /[!@#$%^&*(),.?":{}|<>\[\]\\/\\~`_\-+=;:]/.test(v),
    "Password must contain at least one special character.",
  );

const DateOfBirthSchema = z
  .string()
  .nullable()
  .or(z.literal(""))
  .refine((val) => {
    if (!val) return true;
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return false;

    const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 10 && age <= 100;
  }, "Date of birth must indicate the user is between 10 and 100 years old.");

export enum UserCategory {
  Student = 1,
  Lecturer = 2,
  Staff = 3,
  External = 4,
}

export const LoginSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: PasswordSchema,
});

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Email is invalid"),
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
    category: z.preprocess(
      (val) => (val === undefined || val === null ? UserCategory.Student : Number(val)),
      z.nativeEnum(UserCategory),
    ),
    studentId: z.string().nullable().or(z.literal("")),
    dateOfBirth: DateOfBirthSchema,
    majorOrClass: z.string().nullable().or(z.literal("")),
    phoneNumber: z
      .string()
      .nullable()
      .or(z.literal(""))
      .refine((val) => {
        if (!val) return true;
        return VIETNAMESE_PHONE_REGEX.test(val);
      }, "Invalid Vietnamese phone number format"),
    address: z.string().nullable().or(z.literal("")),
    gender: z.preprocess(
      (val) => (val === "" || val === null ? null : Number(val)),
      z.number().int().min(1).max(3).nullable(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    if (
      data.category === UserCategory.Student &&
      (!data.studentId || data.studentId.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập Mã số sinh viên.",
        path: ["studentId"],
      });
    }
  });

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must not exceed 200 characters"),
  imgUrl: z
    .string()
    .url("Invalid avatar URL format")
    .max(500, "Image URL must not exceed 500 characters")
    .nullable()
    .or(z.literal("")),
  dateOfBirth: DateOfBirthSchema,
  majorOrClass: z
    .string()
    .max(200, "Major/Class must not exceed 200 characters")
    .nullable()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .nullable()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;
      return VIETNAMESE_PHONE_REGEX.test(val);
    }, "Phone number must match Vietnamese format (e.g. 0912345678)"),
  address: z
    .string()
    .max(500, "Address must not exceed 500 characters")
    .nullable()
    .or(z.literal("")),
  gender: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().int().min(1).max(3).nullable(),
  ),
});

export type LoginBodyType = z.infer<typeof LoginSchema>;
export type RegisterBodyType = z.infer<typeof RegisterSchema>;
export type UpdateProfileBodyType = z.infer<typeof UpdateProfileSchema>;

export interface LoginResponse {
  value: {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
    refreshTokenExpiresAt?: string;
    category?: number;
  };
  statusCode?: number;
  message?: string;
}

export interface RegisterResponse {
  value?: {
    userId?: string;
    category?: number;
    requiresEmailVerification?: boolean;
  };
  isSuccess?: boolean;
  statusCode?: number;
  message?: string;
  errorCode?: string;
}

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token không hợp lệ"),
    newPassword: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export interface ForgotPasswordBody {
  email: string;
}

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordSchema>;

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordSchema>;

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
