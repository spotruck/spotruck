/**
 * Système d'authentification MOCK — fonctionne sans Supabase
 * Remplacer par Supabase quand les clés sont disponibles
 */

export type UserRole = "foodtrucker" | "organisateur";

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const STORAGE_KEY = "spotruck_mock_user";

// Comptes de démo pré-enregistrés pour les tests
const DEMO_ACCOUNTS: MockUser[] = [
  {
    id: "demo-ft-1",
    email: "foodtrucker@demo.fr",
    firstName: "Jean",
    lastName: "Martin",
    role: "foodtrucker",
  },
  {
    id: "demo-org-1",
    email: "organisateur@demo.fr",
    firstName: "Sophie",
    lastName: "Legrand",
    role: "organisateur",
  },
];

// Base de données mock en mémoire (persiste via sessionStorage)
function getMockDB(): Array<MockUser & { password: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem("spotruck_mock_db");
    if (raw) return JSON.parse(raw);
  } catch {}
  // Comptes démo avec mot de passe "Demo1234"
  return DEMO_ACCOUNTS.map((u) => ({ ...u, password: "Demo1234" }));
}

function saveMockDB(db: Array<MockUser & { password: string }>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("spotruck_mock_db", JSON.stringify(db));
}

// ─── API publique ──────────────────────────────────────────────

export function getCurrentUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function signIn(
  email: string,
  password: string
): { user: MockUser } | { error: string } {
  const db = getMockDB();
  const found = db.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) {
    return { error: "Email ou mot de passe incorrect." };
  }
  const { password: _, ...user } = found;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { user };
}

export function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole
): { user: MockUser } | { error: string } {
  const db = getMockDB();
  const exists = db.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { error: "Un compte avec cet email existe déjà." };
  }
  const newUser: MockUser & { password: string } = {
    id: `mock-${Date.now()}`,
    email,
    firstName,
    lastName,
    role,
    password,
  };
  db.push(newUser);
  saveMockDB(db);
  const { password: _, ...user } = newUser;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { user };
}

export function signOut() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getDashboardPath(role: UserRole): string {
  return role === "foodtrucker"
    ? "/dashboard/foodtrucker"
    : "/dashboard/organisateur";
}
