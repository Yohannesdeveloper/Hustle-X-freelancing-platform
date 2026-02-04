import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useAuth } from "../store/hooks";
import { FaMobileAlt, FaCheck, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "../hooks/useTranslation";
import { getBackendUrlSync } from "../utils/portDetector";

const Payment: React.FC = () => {
  const darkMode = useAppSelector((s) => s.theme.darkMode);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const t = useTranslation();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [planId, setPlanId] = useState<string>("");
  const [planDetails, setPlanDetails] = useState<any>(null);

  const getApiBaseUrl = () => {
    if (window.location.hostname.includes("devtunnels")) {
      return `https://${window.location.hostname}`;
    }
    if (process.env.NODE_ENV === "production") {
      return "https://your-domain.com";
    }
    return getBackendUrlSync();
  };

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate("/signup?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    // Get plan from URL params
    const plan = searchParams.get("plan") || "basic";
    setPlanId(plan);
    
    // Fetch plan details
    const fetchPlanDetails = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/pricing/plans/${plan}`);
        const data = await response.json();
        setPlanDetails(data.plan);
      } catch (error) {
        console.error("Error fetching plan details:", error);
      }
    };
    fetchPlanDetails();
  }, [isAuthenticated, navigate, searchParams]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Redirect to Telebirr payment wizard page
      navigate(`/santim-pay?plan=${planId}&method=telebirr`);
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(`Payment failed: ${error.message || "Please try again"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div
      className={`relative min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-black" : "bg-white"
      }`}
    >
      {/* Background */}
      {darkMode ? (
        <div className="fixed inset-0 z-0 bg-black" />
      ) : (
        <div className="fixed inset-0 z-0 bg-white" />
      )}

      <div className="relative z-10 pt-20 sm:pt-24 pb-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16 px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.button
            onClick={() => navigate("/pricing")}
            className={`mb-6 flex items-center gap-2 ${
              darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"
            } transition-colors`}
          >
            <FaArrowLeft />
            <span>{t.payment.backToPricing}</span>
          </motion.button>

          <motion.h1
            className={`text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 ${
              darkMode ? "text-white" : "text-black"
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t.payment.completePayment.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
              {t.payment.completePayment.split(" ").slice(-1)}
            </span>
          </motion.h1>
          <motion.p
            className={`text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t.payment.payWithTelebirr}
          </motion.p>
        </motion.div>

        {/* Plan Summary */}
        {planDetails && (
          <motion.div
            className="max-w-2xl mx-auto mb-8 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div
              className={`rounded-xl p-6 ${
                darkMode
                  ? "bg-black/40 border border-white/10"
                  : "bg-white border border-black/10"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                {t.payment.planSummary}
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <p
                    className={`text-lg font-semibold ${
                      darkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {planDetails.name}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {planDetails.period}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {planDetails.price.toLocaleString()} {planDetails.currency}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Method */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                darkMode
                  ? "bg-black/40 border border-white/10 hover:border-white/20"
                  : "bg-white border border-black/10 hover:border-black/20"
              } shadow-lg w-full max-w-md`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                    <FaMobileAlt className="text-3xl" />
                  </div>
                </div>
                <h3
                  className={`text-2xl font-bold mb-2 text-center ${
                    darkMode ? "text-white" : "text-black"
                  }`}
                >
                  Telebirr
                </h3>
                <p
                  className={`text-sm text-center ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {t.payment.mobileMoneyPayment}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Payment Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex justify-center"
          >
            <motion.button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full max-w-md py-4 px-8 rounded-full font-semibold text-white transition-all duration-300 ${
                isProcessing
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-lg hover:shadow-cyan-500/50"
              }`}
              whileHover={isProcessing ? {} : { scale: 1.05, y: -2 }}
              whileTap={isProcessing ? {} : { scale: 0.95 }}
            >
              {isProcessing ? t.common.loading : t.payment.payWithTelebirr}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
