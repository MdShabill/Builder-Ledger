import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthUser {
  fullName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u)
      sessionStorage.setItem("user",JSON.stringify(u)
    );
    else
      sessionStorage.removeItem("user");
  };

  const logout = () => {
    setUserState(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("selectedSite");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}