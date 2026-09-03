'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isConfigured, isUserAdmin } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFirebaseActive: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  loginAsDemoUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isFirebaseActive: false,
  loginWithGoogle: async () => {},
  loginAsDemoAdmin: () => {},
  loginAsDemoUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(isConfigured && auth));

  useEffect(() => {
    // Check localStorage for demo login first
    if (typeof window !== 'undefined') {
      const demoUserEmail = localStorage.getItem('unitins_fiscal_demo_user');
      if (demoUserEmail) {
        setUser({
          uid: 'demo-user-id',
          email: demoUserEmail,
          displayName: demoUserEmail.includes('suporte') ? 'Administrador UNITINS' : 'Pesquisador/Usuário',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => 'demo-token',
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({}),
        } as unknown as User);
        setLoading(false);
        return;
      }
    }

    if (isConfigured && auth) {
      // Handle redirect result if signInWithRedirect was used
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            setUser(result.user);
          }
        })
        .catch((err) => {
          console.warn('[Firebase Auth] Redirect result warning:', err);
        });

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    if (isConfigured && auth) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err: unknown) {
        const errorObj = err as { code?: string; message?: string };
        const code = errorObj?.code || '';
        console.warn('[Firebase Auth] Popup login failed:', code || err);
        
        if (code === 'auth/unauthorized-domain') {
          const proceed = window.confirm(
            '⚠️ Domínio não autorizado no Firebase Console (auth/unauthorized-domain).\n\n' +
            'Deseja entrar imediatamente em Modo de Demonstração / Teste como Administrador para testar todas as funcionalidades do sistema?'
          );
          if (proceed) {
            loginAsDemoAdmin();
          }
          return;
        }

        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: unknown) {
          const redObj = redirectErr as { code?: string };
          console.error('[Firebase Auth] Redirect login error:', redObj?.code || redirectErr);
          if (redObj?.code === 'auth/unauthorized-domain') {
            const proceed = window.confirm(
              '⚠️ Domínio não autorizado no Firebase Console (auth/unauthorized-domain).\n\n' +
              'Deseja entrar em Modo de Demonstração / Teste como Administrador?'
            );
            if (proceed) {
              loginAsDemoAdmin();
            }
          } else {
            alert('Não foi possível concluir o login com o Google (domínio não autorizado ou popups bloqueados). Entre com o Modo de Demonstração abaixo.');
          }
        }
      }
    } else {
      // Fallback demo login when Firebase is not configured
      loginAsDemoAdmin();
    }
  };

  const loginAsDemoAdmin = () => {
    const adminUser = {
      uid: 'demo-admin-id',
      email: 'suporte.camarapa@gmail.com',
      displayName: 'Administrador UNITINS',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'demo-token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    } as unknown as User;

    setUser(adminUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('unitins_fiscal_demo_user', 'suporte.camarapa@gmail.com');
    }
  };

  const loginAsDemoUser = () => {
    const normalUser = {
      uid: 'demo-participant-id',
      email: 'pesquisador.participante@unitins.br',
      displayName: 'Participante da Pesquisa',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'demo-token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    } as unknown as User;

    setUser(normalUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('unitins_fiscal_demo_user', 'pesquisador.participante@unitins.br');
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unitins_fiscal_demo_user');
    }
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[Firebase Auth] Erro ao deslogar:', err);
      }
    }
    setUser(null);
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
        loginAsDemoAdmin,
        loginAsDemoUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

