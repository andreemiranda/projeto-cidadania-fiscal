'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isConfigured, isUserAdmin } from './firebase';
import AuthGuidanceModal from '@/components/AuthGuidanceModal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFirebaseActive: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  simulateLoginAs: (email: string, name: string) => void;
  openAuthModal: (code?: string, msg?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isFirebaseActive: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
  simulateLoginAs: () => {},
  openAuthModal: () => {},
});

const LOCAL_USER_KEY = 'unitins_simulated_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => Boolean(isConfigured && auth && !user));

  // Guidance modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalErrorCode, setModalErrorCode] = useState<string | null>(null);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(LOCAL_USER_KEY);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const openAuthModal = (code?: string, msg?: string) => {
    setModalErrorCode(code || null);
    setModalErrorMessage(msg || null);
    setIsModalOpen(true);
  };

  const loginWithGoogle = async () => {
    if (isConfigured && auth) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err: unknown) {
        const errorObj = err as { code?: string; message?: string };
        const code = errorObj?.code || '';
        const msg = errorObj?.message || (err instanceof Error ? err.message : String(err));

        console.warn('[Firebase Auth] Retorno na tentativa de login:', code || msg);

        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          return;
        }

        openAuthModal(code || 'auth/error', msg);
      }
    } else {
      openAuthModal();
    }
  };

  const simulateLoginAs = (email: string, name: string) => {
    const mockUser = {
      uid: 'user_' + btoa(email).replace(/=/g, ''),
      email,
      displayName: name || email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        name || email
      )}`,
      emailVerified: true,
    } as unknown as User;

    setUser(mockUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    }
  };

  const logout = async () => {
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[Firebase Auth] Erro ao deslogar:', err);
      }
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  };

  const isAdmin = isUserAdmin(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isFirebaseActive: isConfigured,
        loginWithGoogle,
        logout,
        simulateLoginAs,
        openAuthModal,
      }}
    >
      {children}

      {/* Global Guidance Modal for Firebase Authentication and Demo Mode */}
      <AuthGuidanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        errorCode={modalErrorCode}
        errorMessage={modalErrorMessage}
        projectId={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'trabalho-academico-form'}
        onSelectAccount={(email, name) => {
          simulateLoginAs(email, name);
          setIsModalOpen(false);
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
