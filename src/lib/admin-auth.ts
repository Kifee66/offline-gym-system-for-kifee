import { db, AdminSettings } from './db';

const ADMIN_SESSION_KEY = 'gym_admin_session';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime: number;
  expiresAt: number;
}

// Generate random salt
export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash password with salt using PBKDF2
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return Array.from(new Uint8Array(derivedBits), byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
};

// Verify password
export const verifyPassword = async (password: string, hash: string, salt: string): Promise<boolean> => {
  const computedHash = await hashPassword(password, salt);
  return computedHash === hash;
};

// Check if admin is set up
export const isAdminSetup = async (): Promise<boolean> => {
  try {
    const admin = await db.adminSettings.where('isSetup').equals(1).first();
    return !!admin;
  } catch (error) {
    console.error('Error checking admin setup:', error);
    return false;
  }
};

// Setup admin (first time)
export const setupAdmin = async (password: string): Promise<void> => {
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  
  const now = new Date();
  await db.adminSettings.add({
    passwordHash,
    salt,
    isSetup: true,
    createdAt: now,
    updatedAt: now
  });
};

// Login admin
export const loginAdmin = async (password: string): Promise<boolean> => {
  try {
    const admin = await db.adminSettings.where('isSetup').equals(1).first();
    if (!admin) return false;
    
    const isValid = await verifyPassword(password, admin.passwordHash, admin.salt);
    if (isValid) {
      const now = Date.now();
      const session: AdminSession = {
        isAuthenticated: true,
        loginTime: now,
        expiresAt: now + SESSION_DURATION
      };
      
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      
      // Update last login
      await db.adminSettings.update(admin.id!, { 
        lastLogin: new Date(),
        updatedAt: new Date()
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error during admin login:', error);
    return false;
  }
};

// Check if admin session is valid
export const isAdminAuthenticated = (): boolean => {
  try {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) return false;
    
    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();
    
    if (now > session.expiresAt) {
      logoutAdmin();
      return false;
    }
    
    return session.isAuthenticated;
  } catch {
    return false;
  }
};

// Logout admin
export const logoutAdmin = (): void => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

// Change admin password
export const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const admin = await db.adminSettings.where('isSetup').equals(1).first();
    if (!admin) return false;
    
    const isCurrentValid = await verifyPassword(currentPassword, admin.passwordHash, admin.salt);
    if (!isCurrentValid) return false;
    
    const newSalt = generateSalt();
    const newPasswordHash = await hashPassword(newPassword, newSalt);
    
    await db.adminSettings.update(admin.id!, {
      passwordHash: newPasswordHash,
      salt: newSalt,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error changing admin password:', error);
    return false;
  }
};

// Validate password strength
export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: 'Password meets all requirements' };
};