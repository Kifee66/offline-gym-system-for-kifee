import Dexie, { Table } from "dexie";
import bcrypt from "bcryptjs";

// Define tables
export interface AdminSetting {
  id: number;
  isSetup: boolean;
}

export interface AdminCredential {
  id: number;
  username: string;
  passwordHash: string;
}

class GymDB extends Dexie {
  adminSettings!: Table<AdminSetting, number>;
  adminCredentials!: Table<AdminCredential, number>;

  constructor() {
    super("GymDB");
    this.version(1).stores({
      adminSettings: "id, isSetup",
      adminCredentials: "id, username, passwordHash",
    });
  }
}

export const db = new GymDB();

/**
 * Save admin credentials securely (hashed password)
 */
export async function saveAdminCredentials(
  username: string,
  password: string
): Promise<void> {
  const hash = await bcrypt.hash(password, 10);

  await db.adminCredentials.clear(); // only allow one admin
  await db.adminCredentials.add({
    id: 1,
    username,
    passwordHash: hash,
  });
}

/**
 * Validate login credentials
 */
export async function validateAdminLogin(
  username: string,
  password: string
): Promise<boolean> {
  const creds = await db.adminCredentials.get(1);
  if (!creds) return false;

  if (creds.username !== username) return false;

  return await bcrypt.compare(password, creds.passwordHash);
}

/**
 * Mark system as setup complete
 */
export async function markSetupComplete(): Promise<void> {
  await db.adminSettings.clear();
  await db.adminSettings.add({
    id: 1,
    isSetup: true,
  });
}

/**
 * Check if admin setup exists
 */
export async function checkIfSetup(): Promise<boolean> {
  const setting = await db.adminSettings.get(1);
  return setting?.isSetup === true;
}

/**
 * Reset admin setup (for testing)
 */
export async function resetAdminSetup(): Promise<void> {
  await db.adminSettings.clear();
  await db.adminCredentials.clear();
}
