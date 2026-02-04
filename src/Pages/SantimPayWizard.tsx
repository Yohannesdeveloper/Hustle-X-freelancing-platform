import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useAuth } from "../store/hooks";
import { setLanguage, Language } from "../store/languageSlice";
import { FaCheck, FaMobileAlt, FaArrowLeft, FaGlobe } from "react-icons/fa";
import apiService from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { getBackendUrlSync } from "../utils/portDetector";

const SantimPayWizard: React.FC = () => {
  const darkMode = useAppSelector((s) => s.theme.darkMode);
  const language = useAppSelector((s) => s.language.language);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const t = useTranslation();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [planId, setPlanId] = useState<string>("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [transactionId, setTransactionId] = useState<string>("");

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate("/signup?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    // Generate transaction ID
    const txId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTransactionId(txId);

    // Get plan from URL params
    const plan = searchParams.get("plan") || "basic";
    setPlanId(plan);
    
    // Fetch plan details
    const fetchPlanDetails = async () => {
      try {
        const baseUrl = window.location.hostname.includes("devtunnels")
          ? `https://${window.location.hostname}`
          : process.env.NODE_ENV === "production"
          ? "https://your-domain.com"
          : getBackendUrlSync();
        const response = await fetch(`${baseUrl}/api/pricing/plans/${plan}`);
        const data = await response.json();
        setPlanDetails(data.plan);
      } catch (error) {
        console.error("Error fetching plan details:", error);
      }
    };
    fetchPlanDetails();
  }, [isAuthenticated, navigate, searchParams]);

  const steps = [
    { number: 1, label: t.payment.stepPhoneNumber, active: currentStep === 1 },
    { number: 2, label: t.payment.stepPaymentProcess, active: currentStep === 2 },
    { number: 3, label: t.payment.stepConfirmation, active: currentStep === 3 },
  ];

  const handlePhoneNumberSubmit = async () => {
    if (!phoneNumber || !/^09\d{8}$/.test(phoneNumber)) {
      alert("Please enter a valid Telebirr phone number (09XXXXXXXX)");
      return;
    }

    setIsProcessing(true);

    try {
      // Send payment request to phone number via Santim Pay
      const amount = planDetails?.price || 0;
      const currency = planDetails?.currency || "ETB";
      
      const response = await apiService.sendPaymentRequest(phoneNumber, planId, amount, currency);
      
      // Show message that payment request has been sent
      alert(
        `${t.payment.paymentRequestSentTo} ${phoneNumber}!\n\n` +
        `${response.instructions}\n\n` +
        `Transaction ID: ${response.transactionId}\n` +
        `Merchant ID: ${response.merchantId}\n` +
        `Amount: ${response.amount.toLocaleString()} ${response.currency}\n\n` +
        `${t.payment.checkPhoneAndEnterPin}`
      );

      // Move to payment processing step
      setCurrentStep(2);
      
      // Poll for payment confirmation (in production, use webhooks)
      // For now, we'll wait and then check payment status
      const checkPaymentStatus = async () => {
        try {
          // In production, you would poll the payment status endpoint
          // For now, simulate waiting for user to confirm on their phone
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          // After user confirms on phone, subscribe to plan
          await apiService.subscribeToPlan(planId, "telebirr");
          
          // Move to confirmation
          setCurrentStep(3);
          setIsProcessing(false);

          // Redirect after 3 seconds
          setTimeout(() => {
            navigate("/dashboard/hiring");
          }, 3000);
        } catch (error: any) {
          console.error("Payment confirmation error:", error);
          alert(`Payment confirmation failed: ${error.message || "Please try again"}`);
          setIsProcessing(false);
          setCurrentStep(1);
        }
      };

      checkPaymentStatus();
    } catch (error: any) {
      console.error("Payment request error:", error);
      alert(`Failed to send payment request: ${error.response?.data?.message || error.message || "Please try again"}`);
      setIsProcessing(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="bg-gray-800 h-12 flex items-center justify-between px-4">
        <button
          onClick={() => navigate("/pricing")}
          className="text-white hover:text-gray-300 flex items-center gap-2"
        >
          <FaArrowLeft />
          <span>{t.payment.backToPricing}</span>
        </button>
        <div className="flex items-center gap-2">
          <FaGlobe className="text-white" />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="bg-transparent text-white border-none outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
            <option value="ti">ትግርኛ</option>
            <option value="om">Afan Oromo</option>
          </select>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Santim Pay Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-black">SANTIM</span>{" "}
            <span className="text-orange-500">PAY</span>
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      step.completed
                        ? "bg-orange-500 text-white"
                        : step.active
                        ? "bg-orange-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step.completed ? (
                      <FaCheck className="text-white" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      step.active ? "text-orange-500 font-semibold" : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step.completed || step.active ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Transaction ID */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500">{transactionId}</p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">Telebirr</span>
                </div>
                <p className="text-gray-600 mb-6">{t.payment.enterPhoneNumber}</p>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t.payment.enterPhoneNumberPlaceholder}
                  className="w-full max-w-md mx-auto px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-lg"
                  maxLength={10}
                />
              </div>
              <button
                onClick={handlePhoneNumberSubmit}
                disabled={!phoneNumber || phoneNumber.length !== 10}
                className={`w-full max-w-md py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                  phoneNumber && phoneNumber.length === 10
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {t.payment.continue}
              </button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4"></div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">{t.payment.paymentRequestSent}</h2>
              <p className="text-gray-600 mb-2">
                {t.payment.paymentRequestSentTo} <strong>{phoneNumber}</strong>
              </p>
              <p className="text-gray-600 mb-4">
                {t.payment.checkPhoneAndEnterPin}
              </p>
              <p className="text-sm text-gray-500">
                {t.payment.waitingForConfirmation}
              </p>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-white text-4xl" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">{t.payment.paymentSuccessful}</h2>
              <p className="text-gray-600 mb-4">{t.payment.subscriptionActivated}</p>
              <p className="text-sm text-gray-500">{t.payment.redirectingToDashboard}</p>
            </motion.div>
          )}
        </div>

        {/* Plan Summary */}
        {planDetails && currentStep < 3 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{planDetails.name}</span> -{" "}
              {planDetails.price.toLocaleString()} {planDetails.currency}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SantimPayWizard;
