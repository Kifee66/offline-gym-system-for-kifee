import { useEffect, useState, useCallback } from "react";
import Dexie, { Table } from "dexie";

// --- Dexie DB setup ---
interface Admin {
  id: string; // always "admin"
  username: string;
  passwordHash: string;
}

interface Session {
  id: string; // always "session"
  isAuthenticated: boolean;
}

class AdminDB extends Dexie {
  admin!: Table<Admin, string>;
  session!: Table<Session, string>;

  constructor() {
    super("AdminDB");
    this.version(1).stores({
      admin: "id",
      session: "id",
    });
  }
}

const db = new AdminDB();

// --- Password hashing helper ---
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Password strength validation ---
function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  return { isValid: true, message: "Password is strong" };
}

// --- Hook ---
export function useAdmin() {
  const [isSetup, setIsSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load state on mount
  useEffect(() => {
    const load = async () => {
      const admin = await db.admin.get("admin");
      const session = await db.session.get("session");

      setIsSetup(!!admin);
      setIsAuthenticated(session?.isAuthenticated ?? false);
      setIsLoading(false);
    };
    load();
  }, []);

  // Setup new admin account
  const setup = useCallback(async (username: string, password: string) => {
    const existing = await db.admin.get("admin");
    if (existing) throw new Error("Admin already setup");

    const passwordHash = await hashPassword(password);
    await db.admin.put({ id: "admin", username, passwordHash });
    setIsSetup(true);

    // Auto-login after setup
    await db.session.put({ id: "session", isAuthenticated: true });
    setIsAuthenticated(true);

    return { success: true, message: "Admin setup completed successfully" };
  }, []);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    const admin = await db.admin.get("admin");
    if (!admin) return { success: false, message: "Admin not setup" };

    if (admin.username !== username) {
      return { success: false, message: "Invalid username" };
    }

    const hash = await hashPassword(password);
    if (hash !== admin.passwordHash) {
      return { success: false, message: "Invalid password" };
    }

    await db.session.put({ id: "session", isAuthenticated: true });
    setIsAuthenticated(true);
    return { success: true, message: "Login successful" };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await db.session.put({ id: "session", isAuthenticated: false });
    setIsAuthenticated(false);
  }, []);

  // Change password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const admin = await db.admin.get("admin");
      if (!admin) return { success: false, message: "Admin not setup" };

      const currentHash = await hashPassword(currentPassword);
      if (currentHash !== admin.passwordHash) {
        return { success: false, message: "Current password is incorrect" };
      }

      const newHash = await hashPassword(newPassword);
      await db.admin.put({ ...admin, passwordHash: newHash });

      return { success: true, message: "Password changed successfully" };
    },
    []
  );

  return {
    isSetup,
    isAuthenticated,
    isLoading,
    setup,
    login,
    logout,
    changePassword,
    validatePasswordStrength,
  };
}
