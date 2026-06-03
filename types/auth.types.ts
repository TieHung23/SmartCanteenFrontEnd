import { z } from "zod";

// Strong password policy used by both login and register
const PasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine((v) => /[A-Z]/.test(v), "Password must contain at least one uppercase letter.")
    .refine((v) => /\d/.test(v), "Password must contain at least one digit.")
    .refine(
        (v) => /[!@#$%^&*(),.?":{}|<>\[\]\\/\\~`_\-+=;:]/.test(v),
        "Password must contain at least one special character.",
    );

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
        category: z.coerce.number().int().min(1, "Category is required"),
        studentId: z.string().min(1, "Student ID is required"),
        dateOfBirth: z
            .string()
            .min(1, "Date of birth is required")
            .refine((val) => {
                const d = new Date(val);
                if (Number.isNaN(d.getTime())) return false;
                const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                return age >= 10;
            }, "Date of birth must indicate the user is at least 10 years old."),
        majorOrClass: z.string().min(1, "Major/Class is required"),
        phoneNumber: z.string().min(1, "Phone number is required"),
        address: z.string().min(1, "Address is required"),
        gender: z.coerce.number().int().min(1, "Gender is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });


export type LoginBodyType = z.infer<typeof LoginSchema>;
export type RegisterBodyType = z.infer<typeof RegisterSchema>;

export interface LoginResponse {
    value: {
        accessToken: string;
        accessTokenExpiresAt: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
    };
    message: string;
    isSuccess: boolean;
    isFailure: boolean;
    error: Record<string, unknown>;
}

export interface RegisterResponse {
    value?: unknown;
    message: string;
    isSuccess: boolean;
    isFailure: boolean;
    error: Record<string, unknown>;
}