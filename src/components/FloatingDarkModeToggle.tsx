import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useAuth } from "../store/hooks";
import { FaUser, FaSun, FaMoon } from "react-icons/fa";
import { MoreVertical } from "lucide-react";
import { toggleTheme } from "../store/themeSlice";

const FloatingDarkModeToggle: React.FC<{ showProfileOption?: boolean }> = ({ showProfileOption = true }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const darkMode = useAppSelector((s) => s.theme.darkMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  const userRole = user?.currentRole || user?.role || "";
  const isFreelancer = userRole === "freelancer";
  const isClient = userRole === "client";

  const handleProfileClick = () => {
    setMenuOpen(false);
    if (isClient) {
      navigate("/company-profile");
    } else if (isFreelancer) {
      navigate("/freelancer-profile-setup");
    } else if (isAuthenticated) {
      navigate("/freelancer-profile-setup");
    } else {
      navigate("/signup");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuOpen &&
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Position the portal menu
  useEffect(() => {
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const top = Math.round(rect.bottom + 8);
      const right = Math.round(window.innerWidth - rect.right);
      setCoords({ top, right });
    };

    if (menuOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen]);

  const hideOnPages = ["/job-listings", "/job-details", "/preview-job"];
  const shouldHide = hideOnPages.some(
    (p) => location.pathname === p || location.pathname.startsWith("/job-details")
  );
  if (shouldHide) return null;

  return (
    <div className="inline-flex">
      <motion.button
        ref={buttonRef}
        onClick={() => setMenuOpen((s) => !s)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-2 rounded-lg transition-colors duration-300 ${darkMode
          ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
          : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
          }`}
        title="Options"
      >
        <MoreVertical className="w-6 h-6" />
      </motion.button>

      {menuOpen && coords && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            style={{ position: "fixed", top: coords.top, right: coords.right, minWidth: 240 }}
            className={`rounded-xl shadow-2xl overflow-hidden z-[9999] backdrop-blur-md ${darkMode
              ? "bg-gray-900/95 border border-white/10"
              : "bg-white/95 border border-black/10"
              }`}
          >
            {isAuthenticated && showProfileOption && (
              <button
                onClick={handleProfileClick}
                className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-semibold transition-colors ${darkMode
                  ? "text-white hover:bg-white/5"
                  : "text-gray-800 hover:bg-black/5"
                  }`}
              >
                <FaUser className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                Profile
              </button>
            )}
            <button
              onClick={() => {
                dispatch(toggleTheme());
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-semibold transition-colors ${darkMode
                ? "text-white hover:bg-white/5 border-t border-white/5"
                : "text-gray-800 hover:bg-black/5 border-t border-black/5"
                }`}
            >
              {darkMode ? (
                <>
                  <FaSun className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400" />
                  Light Mode
                </>
              ) : (
                <>
                  <FaMoon className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
                  Dark Mode
                </>
              )}
            </button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default FloatingDarkModeToggle;
