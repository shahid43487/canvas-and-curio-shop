import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useCustomer } from "@/hooks/use-customer";
import { adminSignIn } from "@/lib/admin-auth.functions";
import { ADMIN_KEY } from "@/lib/admin-session";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/auth")({ head: () => pageHead("Sign in", "Sign in or create your SMOL STUUF customer account."), component: Auth });
function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const user = useCustomer();
  const navigate = useNavigate();
  const adminLogin = useServerFn(adminSignIn);
  useEffect(() => { if (user) void navigate({ to: "/account", replace: true }); }, [user, navigate]);
  const social = async (provider: "google" | "lovable") => { setBusy(true); setMessage(""); try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" }); if (result.error) throw result.error; } catch (e) { setMessage(e instanceof Error ? e.message : "Sign-in failed"); } finally { setBusy(false); } };
  return <><SiteHeader /><main className="customer-page auth-page"><h1>{mode === "signup" ? "Join the smol club" : mode === "forgot" ? "Reset password" : "Welcome back"}</h1>
    <div className="auth-social"><Button disabled={busy} variant="outline" onClick={() => void social("google")}>Continue with Google</Button><Button disabled={busy} variant="outline" onClick={() => void social("lovable")}>Sign in with Lovable</Button></div>
    <form onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(e.currentTarget); const email = String(form.get("email") ?? "").trim(); const password = String(form.get("password") ?? ""); try {
      if (email.endsWith("@admin") && mode === "login") { const result = await adminLogin({ data: { email, password } }); sessionStorage.setItem(ADMIN_KEY, result.token); await navigate({ to: "/admin" }); return; }
      if (mode === "forgot") { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" }); if (error) throw error; setMessage("Check your email for a password reset link."); }
      else if (mode === "signup") { const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: String(form.get("name") ?? "") } } }); if (error) throw error; setMessage("Check your email to confirm your account."); }
      else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; await navigate({ to: "/account" }); }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Sign-in failed"); } finally { setBusy(false); } }}>
      {mode === "signup" && <label>Display name<input className="admin-input" name="name" maxLength={100} autoComplete="name" /></label>}
      <label>Email<input className="admin-input" name="email" type="text" inputMode="email" autoComplete="username" required /></label>
      {mode !== "forgot" && <label>Password<input className="admin-input" name="password" type="password" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required /></label>}
      <Button disabled={busy} type="submit">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    {message && <p role="status">{message}</p>}
    <div className="auth-switch"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>{mode === "signup" ? "Already a member? Sign in" : "Create account"}</Button><Button variant="link" onClick={() => { setMode(mode === "forgot" ? "login" : "forgot"); setMessage(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div>
  </main><SiteFooter /></>;
}