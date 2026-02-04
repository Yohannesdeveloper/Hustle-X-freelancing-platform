import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WebSocketProvider } from "./context/WebSocketContext";
import { useAppDispatch } from "./store/hooks";
import { checkAuth } from "./store/authSlice";
import HomeFinal from "./Pages/HomeFinal";
import PageLayout from "./components/PageLayout";

import Signup from "./components/Signup";

import PostJob from "./Pages/PostJob";
import PreviewJob from "./Pages/PreviewJob";
import JobListings from "./Pages/Joblistings";
import JobDetailsMongo from "./Pages/JobDetailsMongo";
import Hiringdashboard from "./Pages/Hiringdashboard";
import FreelancingDashboard from "./Pages/FreelancingDashboard";
import EditJobMongo from "./Pages/EditJobMongo";

import BlogPost from "./Pages/BlogPost";
import { BlogPostView } from "./Pages/BlogPostView";
import BlogAdmin from "./Pages/BlogAdmin";
import Blog from "./Pages/Blog";
import EditBlog from "./Pages/EditBlog";
import HowItWorks from "./Pages/HowItWorks";
import AboutUs from "./Pages/AboutUs";
import ContactUs from "./Pages/ContactUs";
import FAQ from "./Pages/FAQ";
import HelpCenter from "./Pages/HelpCenter";
import Pricing from "./Pages/Pricing";
import Payment from "./Pages/Payment";
import SantimPayWizard from "./Pages/SantimPayWizard";
import API from "./Pages/API";
import JobAdmin from "./Pages/JobAdmin";
import JobModeration from "./Pages/JobModeration";

import FreelancerProfileWizard from "./components/FreelancerProfileWizard";
import ClientProfileWizard from "./components/ClientProfileWizard";
import ProfileSetupRouter from "./components/ProfileSetupRouter";
import AccountSettings from "./Pages/AccountSettings";
import CompanyProfile from "./Pages/CompanyProfile";

import RoleSelection from "./Pages/RoleSelection";
import ApplicationsManagementMongo from "./Pages/ApplicationsManagementMongo";
import ForgotPasswordOtp from "./components/ForgotPasswordOtp";
import ChatInterface from "./components/ChatInterface";
import FloatingChatBot from "./components/FloatingChatBot";
import FloatingDarkModeToggle from "./components/FloatingDarkModeToggle";

function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <WebSocketProvider>
      <Routes>
        <Route path="/forgot-password" element={<PageLayout><ForgotPasswordOtp /></PageLayout>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Signup />} />
        <Route path="/" element={<HomeFinal />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/homefinal" element={<Navigate to="/" replace />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/preview-job" element={<PageLayout><PreviewJob /></PageLayout>} />
        <Route path="/dashboard/hiring" element={<Hiringdashboard />} />
        <Route path="/dashboard/freelancer" element={<FreelancingDashboard />} />
        <Route path="/job-listings" element={<JobListings />} />
        <Route path="/job-details/:jobId" element={<PageLayout><JobDetailsMongo /></PageLayout>} />
        <Route path="/edit-job/:id" element={<PageLayout><EditJobMongo /></PageLayout>} />
        <Route path="/admin/blog" element={<PageLayout><BlogAdmin /></PageLayout>} />
        <Route path="/admin/job" element={<PageLayout><JobAdmin /></PageLayout>} />
        <Route path="/jobs/moderation" element={<PageLayout><JobModeration /></PageLayout>} />
        <Route path="/blog/post" element={<PageLayout><BlogPost /></PageLayout>} />
        <Route path="/blog" element={<PageLayout><Blog /></PageLayout>} />
        <Route path="/blog/:id" element={<PageLayout><BlogPostView /></PageLayout>} />
        <Route path="/blog/edit/:id" element={<PageLayout><EditBlog /></PageLayout>} />
        <Route path="/HowItWorks" element={<PageLayout><HowItWorks /></PageLayout>} />
        <Route path="/about-us" element={<PageLayout><AboutUs /></PageLayout>} />
        <Route path="/contact-us" element={<PageLayout><ContactUs /></PageLayout>} />
        <Route path="/faq" element={<PageLayout><FAQ /></PageLayout>} />
        <Route path="/help-center" element={<PageLayout><HelpCenter /></PageLayout>} />
        <Route path="/pricing" element={<PageLayout><Pricing /></PageLayout>} />
        <Route path="/payment" element={<PageLayout><Payment /></PageLayout>} />
        <Route path="/santim-pay" element={<SantimPayWizard />} />
        <Route path="/api" element={<PageLayout><API /></PageLayout>} />
        <Route path="/freelancer-profile-setup" element={<FreelancerProfileWizard />} />
        <Route path="/profile-setup" element={<PageLayout><ProfileSetupRouter /></PageLayout>} />
        <Route path="/company-profile" element={<PageLayout><CompanyProfile /></PageLayout>} />
        <Route path="/role-selection" element={<PageLayout><RoleSelection /></PageLayout>} />
        <Route path="/applications-management" element={<PageLayout><ApplicationsManagementMongo /></PageLayout>} />
        <Route path="/chat" element={<ChatInterface />} />
      </Routes>

      {/* Global Floating Components */}
      <FloatingDarkModeToggle />
      <FloatingChatBot />
    </WebSocketProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
