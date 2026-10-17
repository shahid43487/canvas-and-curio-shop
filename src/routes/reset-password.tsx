import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/smol/SiteHeader";

export const Route = createFileRoute("/reset-password")({ head: () => pageHead("Reset password", "Choose a new SMOL STUUF password."), component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" || sessionStorage.getItem("smol-recovery") === "1"); }, []);
  return <><SiteHeader /><main className="customer-page auth-page"><h1>New password</h1>{!recovery ? <p>Open the password reset link from your email.</p> : <form onSubmit={async e => { e.preventDefault(); const password = String(new FormData(e.currentTarget).get("password") ?? ""); const { error } = await supabase.auth.updateUser({ password }); if (error) setMessage(error.message); else { sessionStorage.removeItem("smol-recovery"); await navigate({ to: "/account" }); } }}><label>New password<input name="password" type="password" minLength={8} required className="admin-input" autoComplete="new-password" /></label><Button type="submit">Save password</Button></form>}{message && <p role="status">{message}</p>}</main></>;
}