import { createContext, useContext } from "react";

// Keep the context outside route modules: route splitting must not duplicate it.
export const ADMIN_KEY = "smol-admin-key";
export const AdminTokenContext = createContext("");
export const useAdminToken = () => useContext(AdminTokenContext);