import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "../lib/api";

interface User {
  id: string; // Changed from number to string to match backend _id
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
  login: (identifier: string, password: string, twoFactorToken?: string) => Promise<{ requiresTwoFactor?: boolean }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing token in localStorage first
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }

    // Validate token with server
    const validate = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl("/api/v1/auth/validate"), {
          method: "GET",
          credentials: "include"
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          // Only redirect to dashboard if on landing page
          if (location.pathname === "/") {
            navigate("/dashboard");
          }
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          // If on a protected route, redirect to login
          const publicPaths = ["/", "/login", "/signup"];
          const isPublic = publicPaths.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));
          if (!isPublic) navigate("/login");
        }
      } catch (error) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        const publicPaths = ["/", "/login", "/signup"];
        const isPublic = publicPaths.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));
        if (!isPublic) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [navigate, location.pathname]);

  // Aggressive session validation - check every 3 seconds if session is still valid
  useEffect(() => {
    if (!user || !token) return;

    const checkSession = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/v1/auth/validate"), {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          // Session was terminated by admin
          if (data.error === 'Session terminated' || response.status === 401) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            
            // Force immediate logout with alert
            alert('⚠️ SESSION TERMINATED\n\nYour session has been terminated by an administrator.\n\nYou will be redirected to the login page.');
            
            // Force redirect
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    // Check immediately
    checkSession();

    // Then check every 3 seconds for instant detection
    const intervalId = setInterval(checkSession, 3000);

    return () => clearInterval(intervalId);
  }, [user, token, navigate, toast]);

  const login = async (identifier: string, password: string, twoFactorToken?: string) => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username: identifier.toLowerCase(), password, twoFactorToken })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        return { requiresTwoFactor: true };
      }
      
      // Store the token in localStorage for API calls
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      }
      
      setUser({
        id: data.user._id,
        username: data.user.username,
        fullName: data.user.firstName && data.user.lastName ? `${data.user.firstName} ${data.user.lastName}` : undefined,
        email: data.user.email,
        organization: data.user.organization,
        department: data.user.department,
        jobPosition: data.user.jobPosition,
        roles: data.user.roles
      });
      navigate("/dashboard");
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!`,
        variant: "default"
      });
      
      return {};
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
    setLoading(true);
    try {
      await fetch(buildApiUrl("/api/v1/auth/logout"), { method: "POST", credentials: "include" });
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      navigate("/");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
