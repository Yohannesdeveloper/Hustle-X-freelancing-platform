import React from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { toggleTheme } from "../store/themeSlice";
import { FaSun, FaMoon } from "react-icons/fa";

const FloatingDarkModeToggle: React.FC = () => {
    const dispatch = useAppDispatch();
    const darkMode = useAppSelector((s) => s.theme.darkMode);

    const toggleDarkMode = () => {
        dispatch(toggleTheme());
    };

    return (
        <motion.button
            onClick={toggleDarkMode}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`fixed top-14 right-4 z-[9999] w-10 h-10 rounded-full shadow-2xl flex items-center justify-center transition-colors duration-300 ${darkMode
                ? "bg-gray-800 text-yellow-400 border border-gray-700"
                : "bg-white text-gray-700 border border-gray-200"
                }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {darkMode ? (
                <FaSun className="w-5 h-5 animate-pulse" />
            ) : (
                <FaMoon className="w-5 h-5" />
            )}
        </motion.button>
    );
};

export default FloatingDarkModeToggle;
