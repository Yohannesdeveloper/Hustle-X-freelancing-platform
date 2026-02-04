import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../store/hooks";
import { useAppSelector } from "../store/hooks";
import useProfile from "../hooks/useProfile";
import {
  User,
  Building2,
  Briefcase,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, switchRole } = useAuth();
  const darkMode = useAppSelector((s) => s.theme.darkMode);
  const { profileData, getFullName, getStatus, updateProfile } = useProfile();
  const [selectedRole, setSelectedRole] = useState<"freelancer" | "client" | null>(null);
  const [saving, setSaving] = useState(false);

  // Check authentication before allowing access to role selection
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return path
      navigate("/signup?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
  }, [isAuthenticated, navigate]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <div className={`w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`} />
          <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Allow users to see role selection even if they have a role
  // They can change their role if needed

  const handleRoleSelect = async (role: "freelancer" | "client") => {
    setSelectedRole(role);
    setSaving(true);

    try {
      // Switch to the selected role using the API
      await switchRole(role);

      // Navigate to the appropriate page based on role and profile completion
      setTimeout(() => {
        if (role === "freelancer") {
          if (user?.profile?.isProfileComplete) {
            navigate("/dashboard/freelancer");
          } else {
            navigate("/freelancer-profile-setup");
          }
        } else if (role === "client") {
          if (user?.hasCompanyProfile) {
            navigate("/dashboard/hiring");
          } else {
            navigate("/dashboard/hiring"); // Don't redirect to company profile
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error selecting role:", error);
      alert("Failed to set your role. Please try again.");
      setSaving(false);
    }
  };
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-black" : "bg-white"}`}>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-[800px] h-[800px] bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-10 blur-3xl rounded-full top-0 left-0 ${darkMode ? "" : "opacity-5"}`} />
        <div className={`absolute w-[600px] h-[600px] bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 opacity-10 blur-3xl rounded-full bottom-0 right-0 ${darkMode ? "" : "opacity-5"}`} />
        <div className={`absolute w-[400px] h-[400px] bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-500 opacity-15 blur-3xl rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${darkMode ? "" : "opacity-5"}`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-4">
            Choose Your Path
          </h1>
          <p className={`text-lg md:text-xl ${darkMode ? "text-gray-300" : "text-gray-600"} max-w-2xl mx-auto`}>
            Select how you want to use HustleX and start building your professional journey
          </p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className={`grid gap-8 mb-12 ${user?.roles?.includes("freelancer") && user?.roles?.includes("client") ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-2xl mx-auto"}`}>
          {/* Freelancer Card - Show only if user has freelancer role */}
          {user?.roles?.includes("freelancer") && (
            <motion.div
              className={`relative rounded-3xl p-8 shadow-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                selectedRole === "freelancer"
                  ? darkMode
                    ? "bg-cyan-500/10 border-cyan-400/50 shadow-cyan-500/20"
                    : "bg-cyan-500/5 border-cyan-400/50 shadow-cyan-500/20"
                  : darkMode
                  ? "bg-black/40 border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/5"
                  : "bg-white/40 border-cyan-500/10 hover:border-cyan-400/30 hover:bg-cyan-500/5"
              }`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onClick={() => !saving && handleRoleSelect("freelancer")}
            >
              {selectedRole === "freelancer" && (
                <motion.div
                  className="absolute top-4 right-4 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                </motion.div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedRole === "freelancer"
                    ? "bg-cyan-500/20"
                    : darkMode
                    ? "bg-cyan-500/10"
                    : "bg-cyan-500/5"
                }`}>
                  <User className={`w-8 h-8 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`}>
                    I'm a Freelancer
                  </h2>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Offer your skills and services
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Briefcase className={`w-5 h-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Browse and apply to jobs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className={`w-5 h-5 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Build your portfolio and reputation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className={`w-5 h-5 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Get rated and earn more
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-900/50" : "bg-gray-100/50"}`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Perfect for:
                </h3>
                <ul className={`text-sm space-y-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <li>• Web Developers</li>
                  <li>• Graphic Designers</li>
                  <li>• Content Writers</li>
                  <li>• Marketing Specialists</li>
                  <li>• And many more professionals</li>
                </ul>
              </div>

              <button
                disabled={saving}
                className={`w-full mt-6 py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  selectedRole === "freelancer" ? "animate-pulse" : ""
                }`}
              >
                {saving && selectedRole === "freelancer" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up your profile...
                  </>
                ) : (
                  <>
                    Continue as Freelancer
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Client Card - Show only if user has client role */}
          {user?.roles?.includes("client") && (
            <motion.div
              className={`relative rounded-3xl p-8 shadow-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                selectedRole === "client"
                  ? darkMode
                    ? "bg-green-500/10 border-green-400/50 shadow-green-500/20"
                    : "bg-green-500/5 border-green-400/50 shadow-green-500/20"
                  : darkMode
                  ? "bg-black/40 border-cyan-500/20 hover:border-green-400/40 hover:bg-green-500/5"
                  : "bg-white/40 border-cyan-500/10 hover:border-green-400/30 hover:bg-green-500/5"
              }`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => !saving && handleRoleSelect("client")}
            >
              {selectedRole === "client" && (
                <motion.div
                  className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                </motion.div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedRole === "client"
                    ? "bg-green-500/20"
                    : darkMode
                    ? "bg-green-500/10"
                    : "bg-green-500/5"
                }`}>
                  <Building2 className={`w-8 h-8 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    I'm a Client
                  </h2>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Hire talented freelancers
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Users className={`w-5 h-5 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Post jobs and find talent
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className={`w-5 h-5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Manage projects and applications
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Scale your business with experts
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-900/50" : "bg-gray-100/50"}`}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Perfect for:
                </h3>
                <ul className={`text-sm space-y-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <li>• Startups and Businesses</li>
                  <li>• Project Managers</li>
                  <li>• Entrepreneurs</li>
                  <li>• Companies seeking talent</li>
                  <li>• Anyone needing professional services</li>
                </ul>
              </div>

              <button
                disabled={saving}
                className={`w-full mt-6 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  selectedRole === "client" ? "animate-pulse" : ""
                }`}
              >
                {saving && selectedRole === "client" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up your profile...
                  </>
                ) : (
                  <>
                    Continue as Client
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>

        {/* Profile Button 
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button
            onClick={() => navigate("/company-profile")}
            className={`px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/25`}
          >
            <User className="w-5 h-5" />
            Register Company Profile
          </button>
        </motion.div>

        Additional Info */}
        <motion.div
          className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <p className="text-sm">
            You can always switch between roles or update your profile settings later.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleSelection;
