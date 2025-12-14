import { useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

const USERS_KEY = "mazigho_users";
const CURRENT_USER_KEY = "mazigho_current_user";

export function useLocalAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au montage
  useEffect(() => {
    const currentUserJson = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      try {
        setUser(JSON.parse(currentUserJson));
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const register = (email: string, password: string, firstName: string, lastName: string): boolean => {
    const users = getAllUsers();
    
    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      firstName,
      lastName,
    };

    // Sauvegarder le nouvel utilisateur
    users.push({ ...newUser, password }); // Note: en production, ne jamais stocker le mot de passe en clair!
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Connecter automatiquement
    login(email, password);
    return true;
  };

  const login = (email: string, password: string): boolean => {
    const users = getAllUsers();
    const foundUser = users.find(u => u.email === email && (u as any).password === password);

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser as any;
      setUser(userWithoutPassword);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return false;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    // Mettre à jour dans la liste des utilisateurs
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return true;
  };

  const getAllUsers = (): (User & { password?: string })[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (!usersJson) return [];
    try {
      return JSON.parse(usersJson);
    } catch {
      return [];
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile,
  };
}
