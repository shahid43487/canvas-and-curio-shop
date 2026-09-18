import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

export const SECRET_ACCESS_KEY = "smol-prank-door";

export function SecretGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(SECRET_ACCESS_KEY) === "open") {
      setAllowed(true);
      return;
    }
    navigate({ to: "/", replace: true });
  }, [navigate]);

  if (!allowed) return null;
  return children;
}