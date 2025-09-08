import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { fadeIn } from "@/utils/animations";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-jetBlack text-coolWhite">
        <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-jetBlack text-coolWhite overflow-hidden">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      
      <motion.main 
        className="flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? '70px' : '240px' }}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default Layout;