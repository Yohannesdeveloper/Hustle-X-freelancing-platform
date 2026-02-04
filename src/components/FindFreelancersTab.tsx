import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "../store/hooks";
import { useAuth } from "../store/hooks";
import { useNavigate } from "react-router-dom";
import { Search, Filter, X, MapPin, Briefcase, Clock, MessageCircle, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import apiService from "../services/api";
import { FreelancerWithStatus } from "../types";
import StatusIndicator from "./StatusIndicator";
import FreelancerProfileModal from "./FreelancerProfileModal";

const CACHE_KEY = "freelancers_cache";
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface FindFreelancersTabProps {
  sharedFreelancers?: FreelancerWithStatus[];
  setSharedFreelancers?: (freelancers: FreelancerWithStatus[]) => void;
}

const FindFreelancersTab: React.FC<FindFreelancersTabProps> = ({ 
  sharedFreelancers, 
  setSharedFreelancers 
}) => {
  const darkMode = useAppSelector((s) => s.theme.darkMode);
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use shared state if provided, otherwise use local state
  const [localFreelancers, setLocalFreelancers] = useState<FreelancerWithStatus[]>([]);
  const freelancers = sharedFreelancers || localFreelancers;
  
  const setFreelancers = (newFreelancers: FreelancerWithStatus[]) => {
    if (setSharedFreelancers) {
      setSharedFreelancers(newFreelancers);
    } else {
      setLocalFreelancers(newFreelancers);
    }
  };
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerWithStatus | null>(null);
  const [filters, setFilters] = useState({
    skills: [] as string[],
    location: "",
    status: "" as "" | "online" | "offline" | "available" | "busy",
    experienceLevel: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const hasFetchedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from cache on mount
  useEffect(() => {
    const loadCachedFreelancers = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          // Use cache if less than timeout old
          if (age < CACHE_TIMEOUT && Array.isArray(data) && data.length > 0) {
            console.log("Loading freelancers from cache");
            setFreelancers(data);
            setLoading(false);
            return true;
          }
        }
      } catch (error) {
        console.error("Failed to load cached freelancers:", error);
      }
      return false;
    };

    // Try to load from cache first
    const cacheLoaded = loadCachedFreelancers();
    
    // Always fetch fresh data, but cache provides instant display
    if (!hasFetchedRef.current) {
      fetchFreelancers();
      hasFetchedRef.current = true;
    }
  }, []);

  // Save to cache when freelancers change
  useEffect(() => {
    if (freelancers.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: freelancers,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.error("Failed to cache freelancers:", error);
      }
    }
  }, [freelancers]);

  const fetchFreelancers = async (retries = 3) => {
    try {
      setLoading(true);
      const data = await apiService.getFreelancersWithStatus();
      console.log("Fetched freelancers data:", data);
      console.log("Number of freelancers:", Array.isArray(data) ? data.length : 0);
      // Only update if we got valid data
      if (Array.isArray(data)) {
        console.log("Setting freelancers:", data.length);
        setFreelancers(data);
        // Clear any retry timeout on success
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } else {
        console.warn("Invalid freelancers data received:", data);
        // Keep existing freelancers if API returns invalid data
      }
    } catch (error: any) {
      console.error("Error fetching freelancers:", error);
      
      // Check if it's a network error (backend not running)
      const isNetworkError = error?.code === 'ERR_NETWORK' || 
                            error?.code === 'ECONNREFUSED' ||
                            error?.message?.includes('Network Error') || 
                            error?.message?.includes('CONNECTION_REFUSED');
      
      if (isNetworkError) {
        console.warn("Backend server appears to be offline. Please ensure the backend server is running on port 5000.");
        
        // Retry logic for network errors
        if (retries > 0) {
          console.log(`Retrying in 2 seconds... (${retries} attempts remaining)`);
          retryTimeoutRef.current = setTimeout(() => {
            fetchFreelancers(retries - 1);
          }, 2000);
        } else {
          // Final failure - keep existing freelancers if we have any
          if (freelancers.length === 0) {
            // Try to load from cache as last resort
            try {
              const cached = localStorage.getItem(CACHE_KEY);
              if (cached) {
                const { data } = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                  setFreelancers(data);
                }
              }
            } catch (e) {
              console.error("Failed to load from cache:", e);
            }
          }
        }
      } else {
        // For other errors, only clear if we have no freelancers yet
        if (freelancers.length === 0) {
          setFreelancers([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Get unique skills and locations from freelancers
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    freelancers.forEach((f) => {
      f.profile?.skills?.forEach((skill) => skillsSet.add(skill));
    });
    return Array.from(skillsSet).sort();
  }, [freelancers]);

  const allLocations = useMemo(() => {
    const locationsSet = new Set<string>();
    freelancers.forEach((f) => {
      if (f.profile?.location) {
        locationsSet.add(f.profile.location);
      }
    });
    return Array.from(locationsSet).sort();
  }, [freelancers]);

  // Filter freelancers based on search and filters
  const filteredFreelancers = useMemo(() => {
    console.log("Filtering freelancers. Total:", freelancers.length);
    const filtered = freelancers.filter((freelancer) => {
      // Filter out the current user to prevent self-messaging
      if (user?._id && freelancer._id === user._id) {
        return false;
      }
      
      const profile = freelancer.profile || {};
      const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim().toLowerCase();
      const email = freelancer.email.toLowerCase();
      const skills = profile.skills || [];
      const location = profile.location || "";

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !fullName.includes(searchLower) &&
          !email.includes(searchLower) &&
          !skills.some((s) => s.toLowerCase().includes(searchLower)) &&
          !profile.primarySkill?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Skills filter
      if (filters.skills.length > 0) {
        if (!filters.skills.some((skill) => skills.includes(skill))) {
          return false;
        }
      }

      // Location filter
      if (filters.location && location !== filters.location) {
        return false;
      }

      // Status filter
      if (filters.status && freelancer.status !== filters.status) {
        return false;
      }

      // Experience level filter
      if (
        filters.experienceLevel &&
        profile.experienceLevel !== filters.experienceLevel
      ) {
        return false;
      }

      return true;
    });
    console.log("Filtered freelancers count:", filtered.length);
    return filtered;
  }, [freelancers, searchTerm, filters, user?._id]);

  const toggleSkillFilter = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const clearFilters = () => {
    setFilters({
      skills: [],
      location: "",
      status: "",
      experienceLevel: "",
    });
    setSearchTerm("");
  };

  const handleViewProfile = (freelancer: FreelancerWithStatus) => {
    setSelectedFreelancer(freelancer);
  };

  const handleMessage = (freelancer: FreelancerWithStatus) => {
    // Navigate to chat interface with freelancer ID
    navigate("/chat", {
      state: {
        freelancerId: freelancer._id,
        freelancer: freelancer,
      },
    });
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 ${
          darkMode 
            ? "bg-gradient-to-br from-gray-900 via-black to-gray-900" 
            : "bg-gradient-to-br from-cyan-50 via-white to-blue-50"
        }`} />
        <motion.div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            darkMode ? "bg-cyan-500" : "bg-cyan-400"
          }`}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            darkMode ? "bg-blue-500" : "bg-blue-400"
          }`}
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-6 backdrop-blur-xl ${
          darkMode 
            ? "bg-black/40 border-b border-white/10" 
            : "bg-white/60 border-b border-gray-200/50"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <motion.div
              className={`p-3 rounded-2xl ${
                darkMode 
                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30" 
                  : "bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200"
              }`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Sparkles className={`w-6 h-6 ${
                darkMode ? "text-cyan-400" : "text-cyan-600"
              }`} />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                Find Elite Freelancers
              </h2>
              <p className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Discover top talent ready to work
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? "text-cyan-400" : "text-cyan-600"
              }`}
            />
            <input
              type="text"
              placeholder="Search by name, skill, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all backdrop-blur-xl ${
                darkMode
                  ? "bg-white/5 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-500 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                  : "bg-white/80 border-cyan-200 text-black placeholder-gray-500 focus:border-cyan-500 focus:bg-white focus:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
              } focus:outline-none focus:ring-4 focus:ring-cyan-500/20`}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Freelancers Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className={`w-16 h-16 border-4 rounded-full mx-auto mb-6 ${
                  darkMode 
                    ? "border-cyan-500/30 border-t-cyan-500" 
                    : "border-cyan-200 border-t-cyan-500"
                }`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                className={`text-lg font-semibold ${
                  darkMode ? "text-cyan-400" : "text-cyan-600"
                }`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Discovering Elite Talent...
              </motion.p>
            </motion.div>
          </div>
        ) : filteredFreelancers.length === 0 && !loading ? (
          <motion.div
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <motion.div
                className={`w-24 h-24 rounded-full mx-auto mb-6 ${
                  darkMode 
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500/30" 
                    : "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-cyan-200"
                } flex items-center justify-center`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Search className={`w-12 h-12 ${
                  darkMode ? "text-gray-600" : "text-gray-400"
                }`} />
              </motion.div>
              <p className={`text-xl font-bold mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                No freelancers found
              </p>
              <p className={`text-sm ${
                darkMode ? "text-gray-500" : "text-gray-500"
              }`}>
                {searchTerm || filters.skills.length > 0 || filters.location || filters.status || filters.experienceLevel
                  ? "Try adjusting your search or filters"
                  : "No freelancers available at the moment"}
              </p>
            </div>
          </motion.div>
        ) : filteredFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFreelancers.map((freelancer, index) => {
              const profile = freelancer.profile || {};
              const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || freelancer.email;
              const primarySkill = profile.primarySkill || profile.skills?.[0] || "Freelancer";
              const location = profile.location || "Not specified";
              const monthlyRate = profile.monthlyRate || "0";
              const currency = profile.currency || "ETB";

              return (
                <motion.div
                  key={freelancer._id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ 
                    y: -8,
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className={`group relative rounded-2xl border-2 p-6 cursor-pointer transition-all backdrop-blur-xl overflow-hidden ${
                    darkMode
                      ? "bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]"
                      : "bg-gradient-to-br from-white to-gray-50/50 border-cyan-200 hover:border-cyan-400 hover:shadow-2xl"
                  }`}
                  onClick={() => handleViewProfile(freelancer)}
                >
                  {/* Shine Effect */}
                  <motion.div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      darkMode 
                        ? "bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" 
                        : "bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent"
                    }`}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <motion.div
                        className="relative flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div
                          className={`w-16 h-16 rounded-2xl ${
                            darkMode 
                              ? "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-500/50" 
                              : "bg-gradient-to-br from-cyan-100 to-blue-100 border-2 border-cyan-200"
                          } flex items-center justify-center text-2xl font-bold shadow-lg`}
                        >
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        {freelancer.status && (
                          <motion.div
                            className="absolute -bottom-1 -right-1"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <StatusIndicator status={freelancer.status} size="sm" />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg mb-1 truncate ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {fullName}
                        </h3>
                        <p className={`text-sm font-medium mb-3 truncate ${
                          darkMode ? "text-cyan-400" : "text-cyan-600"
                        }`}>
                          {primarySkill}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${
                              darkMode ? "text-cyan-400" : "text-cyan-600"
                            }`} />
                            <span className={`text-xs font-medium ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}>
                              {location}
                            </span>
                          </div>
                          {monthlyRate !== "0" && (
                            <div className="flex items-center gap-2">
                              <Briefcase className={`w-4 h-4 ${
                                darkMode ? "text-cyan-400" : "text-cyan-600"
                              }`} />
                              <span className={`text-xs font-bold ${
                                darkMode ? "text-cyan-300" : "text-cyan-700"
                              }`}>
                                {monthlyRate} {currency}/mo
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.skills.slice(0, 3).map((skill, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              darkMode
                                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border border-cyan-200"
                            }`}
                          >
                            {skill}
                          </motion.span>
                        ))}
                        {profile.skills.length > 3 && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                              darkMode 
                                ? "bg-white/10 text-gray-400 border border-white/20" 
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            +{profile.skills.length - 3} more
                          </motion.span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(freelancer);
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          darkMode
                            ? "bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-white/40"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-gray-200 hover:border-gray-300"
                        }`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Profile
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessage(freelancer);
                        }}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          darkMode
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50"
                            : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <MessageCircle className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Profile Modal */}
      {selectedFreelancer && (
        <FreelancerProfileModal
          freelancer={selectedFreelancer}
          onClose={() => setSelectedFreelancer(null)}
          onMessage={() => {
            if (selectedFreelancer) {
              const freelancerToMessage = selectedFreelancer;
              setSelectedFreelancer(null);
              handleMessage(freelancerToMessage);
            }
          }}
        />
      )}
    </div>
  );
};

export default FindFreelancersTab;
