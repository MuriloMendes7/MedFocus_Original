import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient, clearTokenCache, isNeonAuthConfigured } from '../lib/auth';
import api from '../utils/api';

const AuthContext = createContext(null);

const PENDING_REGISTRATION_KEY = 'medfocus_pending_registration';

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBackendProfile = useCallback(async () => {
    const { data } = await api.get('/me');
    let profile = data.data.user;

    const pendingRaw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (pendingRaw) {
      sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
      try {
        const pending = JSON.parse(pendingRaw);
        if (pending.phone && !profile.phone) {
          const patched = await api.patch('/me', {
            name: pending.name || profile.name,
            phone: pending.phone,
          });
          profile = patched.data.data;
        }
      } catch {
        // Ignora falha ao aplicar metadados opcionais
      }
    }

    setUser(profile);
    setPlanDetails(data.data.planDetails);
    setPlans(data.data.plans);
    return profile;
  }, []);

  const refreshSession = useCallback(async () => {
    const demoToken = localStorage.getItem('medfocus_demo_token');
    if (demoToken) {
      try {
        const stored = localStorage.getItem('medfocus_demo_user');
        const demoUser = stored ? JSON.parse(stored) : null;
        if (demoUser) {
          setUser(demoUser);
          setPlanDetails({
            id: 'premium',
            name: 'Premium (Demonstração)',
            price: '49,90',
            description: 'Acesso total aos baralhos e simulados.',
            limits: { ownCards: null, monthlyQuizzes: null },
          });
        }
        await loadBackendProfile();
      } catch {
        // Usa perfil em cache local se backend não responder
      } finally {
        setLoading(false);
      }
      return null;
    }

    if (!authClient) {
      setLoading(false);
      return null;
    }
    try {
      const sessionResult = await authClient.getSession();
      if (!sessionResult?.data?.session || !sessionResult?.data?.user) {
        clearTokenCache();
        setUser(null);
        setPlanDetails(null);
        return null;
      }
      return await loadBackendProfile();
    } catch {
      clearTokenCache();
      setUser(null);
      setPlanDetails(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadBackendProfile]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginAsDemo = async (role = 'student') => {
    const demoUser = {
      id: 'demo-user-123',
      name: role === 'admin' ? 'Coordenação MedFocus' : 'Aluno Demonstrativo',
      email: role === 'admin' ? 'admin@medfocus.com' : 'aluno@medfocus.com',
      phone: null,
      role,
      plan: 'premium',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('medfocus_demo_token', 'demo-token');
    localStorage.setItem('medfocus_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setPlanDetails({
      id: 'premium',
      name: 'Premium',
      price: '49,90',
      description: 'Acesso completo a todos os recursos.',
      limits: { ownCards: null, monthlyQuizzes: null },
    });
    setLoading(false);
    try {
      await loadBackendProfile();
    } catch {}
    return demoUser;
  };

  const signIn = async ({ email, password }) => {
    if (!authClient) {
      throw new Error('Serviço de autenticação indisponível no momento. Tente novamente.');
    }
    clearTokenCache();
    localStorage.removeItem('medfocus_demo_token');
    localStorage.removeItem('medfocus_demo_user');
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      throw new Error(
        error.code === 'INVALID_EMAIL_OR_PASSWORD'
          ? 'E-mail ou senha incorretos.'
          : error.message || 'Não foi possível entrar.',
      );
    }
    return await refreshSession();
  };

  const signUp = async ({ name, email, password, phone }) => {
    if (!authClient) {
      throw new Error('Serviço de autenticação indisponível no momento. Tente novamente.');
    }
    clearTokenCache();
    localStorage.removeItem('medfocus_demo_token');
    localStorage.removeItem('medfocus_demo_user');
    if (phone) {
      sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify({ name, phone }));
    }
    const { data, error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
      throw new Error(error.message || 'Não foi possível criar a conta.');
    }
    const profile = await refreshSession();
    return { profile, requiresEmailVerification: !profile && Boolean(data?.user) };
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('medfocus_demo_token');
      localStorage.removeItem('medfocus_demo_user');
      await authClient?.signOut();
    } finally {
      clearTokenCache();
      setUser(null);
      setPlanDetails(null);
      queryClient.clear();
    }
  };

  const updateProfile = async (patch) => {
    try {
      const { data } = await api.patch('/me', patch);
      setUser(data.data);
      return data.data;
    } catch {
      // Atualiza localmente se em modo demo
      setUser((prev) => {
        const next = { ...prev, ...patch };
        localStorage.setItem('medfocus_demo_user', JSON.stringify(next));
        return next;
      });
      return patch;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        planDetails,
        plans,
        loading,
        isNeonAuthConfigured,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
        refreshSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
};
