import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  isAdminSetup, 
  setupAdmin, 
  loginAdmin, 
  logoutAdmin, 
  isAdminAuthenticated,
  changeAdminPassword,
  validatePasswordStrength
} from '@/lib/admin-auth';

export const useAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const adminSettings = useLiveQuery(() => 
    db.adminSettings.where('isSetup').equals(1).first()
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(isAdminAuthenticated());
      setIsLoading(false);
    };

    checkAuth();
    
    // Check authentication periodically
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const setup = async (password: string) => {
    try {
      await setupAdmin(password);
      return { success: true, message: 'Admin setup completed successfully' };
    } catch (error) {
      console.error('Setup error:', error);
      return { success: false, message: 'Failed to setup admin' };
    }
  };

  const login = async (password: string) => {
    try {
      const success = await loginAdmin(password);
      if (success) {
        setIsAuthenticated(true);
        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: 'Invalid password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const validation = validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        return { success: false, message: validation.message };
      }

      const success = await changeAdminPassword(currentPassword, newPassword);
      if (success) {
        return { success: true, message: 'Password changed successfully' };
      }
      return { success: false, message: 'Current password is incorrect' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  };

  return {
    isAuthenticated,
    isLoading,
    isSetup: !!adminSettings,
    setup,
    login,
    logout,
    changePassword,
    validatePasswordStrength
  };
};