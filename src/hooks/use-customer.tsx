import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export const CustomerContext = createContext<User | null>(null);
export const useCustomer = () => useContext(CustomerContext);