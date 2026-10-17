import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator(input => z.object({ email: z.string().max(254), password: z.string().max(200) }).parse(input))
  .handler(async ({ data }) => {
    const email = process.env["ADMIN_LOGIN_EMAIL"];
    const password = process.env["ADMIN_LOGIN_PASSWORD"];
    const key = process.env["ADMIN_TOKEN"];
    if (!email || !password || !key) throw new Error("Admin sign-in is unavailable");
    const digest = async (text: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
    const [actual, expected] = await Promise.all([digest(`${data.email.toLowerCase()}\n${data.password}`), digest(`${email.toLowerCase()}\n${password}`)]);
    if (actual.reduce((diff, byte, i) => diff | (byte ^ (expected[i] ?? 0)), 0) !== 0) throw new Error("Invalid sign-in details");
    const payload = `${Date.now() + 8 * 60 * 60 * 1000}.${crypto.randomUUID()}`;
    const signingKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(payload)));
    return { token: `${payload}.${Array.from(signature, b => b.toString(16).padStart(2, "0")).join("")}` };
  });