import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useAuth } from '../store/hooks';
import FreelancerProfileWizard from './FreelancerProfileWizard';
import ClientProfileWizard from './ClientProfileWizard';

const ProfileSetupRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const darkMode = useAppSelector((s) => s.theme.darkMode);
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);

  const signupRole = searchParams.get('role') || (location.state as any)?.signupRole;

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/signup', { replace: true });
      return;
    }

    // If user already has a completed profile for their role, redirect to dashboard
    if (user) {
      const hasFreelancerRole = user.roles?.includes('freelancer');
      const hasClientRole = user.roles?.includes('client');

      // Check if user has completed freelancer profile (check multiple fields)
      const hasFreelancerProfile = user.profile?.freelancerProfileCompleted ||
                                   user.profile?.isProfileComplete ||
                                   (user.profile?.skills && user.profile?.skills.length > 0);
      const hasClientProfile = user.hasCompanyProfile || user.companyProfile;

      // If user has both roles and both profiles are complete, go to role selection
      if (hasFreelancerRole && hasClientRole && hasFreelancerProfile && hasClientProfile) {
        navigate('/role-selection', { replace: true });
        return;
      }

      // If user only has freelancer role and profile is complete, go to freelancer dashboard
      if (hasFreelancerRole && !hasClientRole && hasFreelancerProfile) {
        navigate('/dashboard/freelancer', { replace: true });
        return;
      }

      // If user only has client role and profile is complete, go to client dashboard
      if (!hasFreelancerRole && hasClientRole && hasClientProfile) {
        navigate('/dashboard/hiring', { replace: true });
        return;
      }

      // If both roles but only one profile complete, go to the completed one's dashboard
      if (hasFreelancerRole && hasClientRole) {
        if (hasFreelancerProfile && !hasClientProfile) {
          // Has freelancer profile, skip client setup for existing users
          navigate('/dashboard/freelancer', { replace: true });
          return;
        }
        if (!hasFreelancerProfile && hasClientProfile) {
          // Has client profile, skip freelancer setup for existing users
          navigate('/dashboard/hiring', { replace: true });
          return;
        }
      }

      // Only show wizard if user is NEW and explicitly needs to set up profile
      // Check if this is a new signup (signupRole param present) vs existing user navigation
      const isNewSignup = signupRole !== null && signupRole !== undefined;
      
      // If user has freelancer role but no profile, only show wizard for new signups
      if (hasFreelancerRole && !hasFreelancerProfile) {
        if (isNewSignup && signupRole === 'freelancer') {
          setIsLoading(false);
          return;
        } else {
          // Existing user - go to dashboard anyway, they can complete profile later
          navigate('/dashboard/freelancer', { replace: true });
          return;
        }
      }

      // If user has client role but no profile, only show when explicitly signing up as client
      if (hasClientRole && !hasClientProfile) {
        if (isNewSignup && signupRole === 'client') {
          setIsLoading(false);
          return;
        } else {
          // Existing user - go to dashboard anyway
          navigate('/dashboard/hiring', { replace: true });
          return;
        }
      }
    }

    setIsLoading(false);
  }, [isAuthenticated, user, navigate, signupRole]);

  // Show loading while checking user status
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <div className={`w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`} />
          <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Determine which wizard to show based on user's roles and signup role
  // Only show wizard for NEW signups, not existing users
  const isNewSignup = signupRole !== null && signupRole !== undefined;
  
  const hasFreelancerProfile = user?.profile?.freelancerProfileCompleted ||
                               user?.profile?.isProfileComplete ||
                               (user?.profile?.skills && user?.profile?.skills.length > 0);
  const hasClientProfile = user?.hasCompanyProfile || user?.companyProfile;
  
  const shouldShowFreelancerWizard = user?.roles?.includes('freelancer') &&
    !hasFreelancerProfile && isNewSignup && signupRole === 'freelancer';

  const shouldShowClientWizard = user?.roles?.includes('client') &&
    !hasClientProfile && isNewSignup && signupRole === 'client';

  // If user needs both profiles, prioritize based on signup role or show freelancer first
  if (shouldShowFreelancerWizard && shouldShowClientWizard) {
    if (signupRole === 'client') {
      return <ClientProfileWizard />;
    }
    return <FreelancerProfileWizard />;
  }

  if (shouldShowFreelancerWizard) {
    return <FreelancerProfileWizard />;
  }

  if (shouldShowClientWizard) {
    return <ClientProfileWizard />;
  }

  // Fallback - redirect to role selection if something goes wrong
  navigate('/role-selection', { replace: true });
  return null;
};

export default ProfileSetupRouter;
