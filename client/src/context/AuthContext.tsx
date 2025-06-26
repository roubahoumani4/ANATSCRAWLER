import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem("authToken");
    const storedUsername = localStorage.getItem("authUsername");
    
    if (storedToken && storedUsername) {
      setToken(storedToken);
      setUser({
        id: 0, // Will be updated when fetching user data
        username: storedUsername
      });
      
      // Validate token with server and fetch complete user data
      validateToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (currentToken: string) => {
    try {
      setLoading(true);
      // Add timeout logic (e.g., 7 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      let response;
      try {
        response = await fetch("/api/validate-token", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${currentToken}`
          },
          credentials: "include",
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(currentToken);
      } else {
        // Token is invalid, clear authentication
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUsername");
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      // In case of error, assume token is invalid
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUsername");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      setLoading(true);
      
      // Using fetch directly to ensure proper handling of the response
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: identifier.toLowerCase(), password })
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authUsername", data.username);
        
        setToken(data.token);
        setUser({
          id: data.id,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          organization: data.organization,
          department: data.department,
          jobPosition: data.jobPosition,
          roles: data.roles || ["user"]
        });
        
        setLocation("/");
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.username}!`,
          variant: "default"
        });
      }
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

  const logout = () => {
    // Clear auth data immediately
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUsername");
    setUser(null);
    setToken(null);
    
    // Immediate redirect without delay
    window.location.replace("/landing");
    
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
        token,
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
