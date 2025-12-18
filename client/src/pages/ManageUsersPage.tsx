import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserPlus, 
  faSearch, 
  faTrash, 
  faUserShield, 
  faUser,
  faEnvelope,
  faLock,
  faTimes,
  faEdit,
  faChartLine
} from "@fortawesome/free-solid-svg-icons";
import { UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

const ManageUsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });

  // Fetch all users
  const { data: usersData, isLoading, error } = useQuery<{ success: boolean; users: User[] }>({
    queryKey: ["/api/v1/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/users", { credentials: "include" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }
      return res.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string; role: string }) => {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
        variant: "default",
      });
      setShowCreateModal(false);
      setNewUser({ username: "", email: "", password: "", confirmPassword: "", role: "user" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
        variant: "default",
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const users = usersData?.users || [];
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.username || !newUser.email || !newUser.password || !newUser.confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
    });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUpdateRole = (user: User, newRole: string) => {
    if (window.confirm(`Change ${user.username}'s role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId: user._id, role: newRole });
    }
  };

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded bg-blue-700/10 text-blue-400">
              <UserCog size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">User Management</h1>
              <p className="text-sm text-gray-400">
                Manage user accounts and permissions
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--crimsonRed))] text-white rounded font-semibold text-sm shadow hover:bg-[hsl(var(--crimsonRed),.85)] transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Create New User
          </motion.button>

          <div className="flex items-center bg-[#232323] rounded-lg px-4 py-2 shadow-inner">
            <FontAwesomeIcon icon={faSearch} className="text-[hsl(var(--crimsonRed))] mr-3" />
            <input
              type="text"
              placeholder="Search users..."
              className="bg-transparent outline-none text-white placeholder-gray-400 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400">{error.message}</p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-[#232323]">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Username</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Email</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Role</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Created</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-gray-800 hover:bg-[#232323] transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                            <span className="font-semibold text-white">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{user.email || "-"}</td>
                        <td className="px-6 py-4">
                          {editingUser?._id === user._id ? (
                            <select
                              value={user.roles.includes('admin') ? 'admin' : 'user'}
                              onChange={(e) => handleUpdateRole(user, e.target.value)}
                              className="bg-[#232323] text-white px-3 py-1 rounded border border-gray-700 text-sm"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded text-xs font-medium ${
                                user.roles.includes('admin') 
                                  ? 'bg-gray-700 text-gray-200' 
                                  : 'bg-gray-800 text-gray-400'
                              }`}>
                                {user.roles.includes('admin') ? 'Admin' : 'User'}
                              </span>
                              <button
                                onClick={() => setEditingUser(user)}
                                className="text-gray-400 hover:text-white transition"
                                title="Change role"
                              >
                                <FontAwesomeIcon icon={faEdit} size="sm" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${
                            user.isActive 
                              ? 'bg-gray-700 text-gray-200' 
                              : 'bg-gray-800 text-gray-500'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <motion.button
                              onClick={() => navigate(`/users/activity/${user._id}`)}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="View Activity Dashboard"
                            >
                              <FontAwesomeIcon icon={faChartLine} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteUser(user._id, user.username)}
                              className="px-4 py-2 bg-[hsl(var(--crimsonRed))] text-white rounded hover:bg-[hsl(var(--crimsonRed),.85)] transition"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[hsl(var(--crimsonRed))]">Create New User</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faLock} className="mr-2 text-gray-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faLock} className="mr-2 text-gray-400" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="Confirm password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faUserShield} className="mr-2 text-gray-400" />
                    Role / Permission
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500 transition"
                    required
                  >
                    <option value="user">User (Normal Access)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    {newUser.role === "admin" 
                      ? "Admin has full access including User Management" 
                      : "User has access to all features except User Management"}
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--crimsonRed))] text-white rounded font-semibold hover:bg-[hsl(var(--crimsonRed),.85)] transition disabled:opacity-50"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUsersPage;
