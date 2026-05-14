import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email("Email is invalid"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});


export type LoginBodyType = z.infer<typeof LoginSchema>;

export interface LoginResponse {
    data: {
        token: string;
        expiresAt: number;
        account: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
    message: string;
}