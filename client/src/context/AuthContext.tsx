import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
  roles?: string[];
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (identifier: string, password: string, csrfToken?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // No localStorage: rely on server session/cookie
    validateToken();
    // Fetch CSRF token on mount
    fetch("/api/csrf-token", { credentials: "include" })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/validate-token", {
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string, csrfToken?: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
        },
        credentials: "include",
        body: JSON.stringify({ username: identifier.toLowerCase(), password })
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const data = await response.json();
      setUser({
        id: data.user._id,
        username: data.user.username
      });
      setLocation("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!`,
        variant: "default"
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    window.location.replace("/");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
      variant: "default"
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
