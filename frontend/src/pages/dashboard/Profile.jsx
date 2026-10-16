import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Shield, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authClient } from '../../lib/auth';

const Profile = () => {
  const { user, planDetails, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setFeedback('Perfil atualizado com sucesso!');
    } catch (err) {
      setFeedback(err.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword.length < 8) {
      setPasswordMsg('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (error) throw new Error(error.message);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg('Senha alterada com sucesso!');
    } catch (err) {
      setPasswordMsg(err.message || 'Não foi possível alterar a senha.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Configurações de Perfil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Gerencie suas informações pessoais, plano e segurança da conta.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-black">
            {(user?.name || user?.email || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold">{user?.name || 'Estudante'}</h3>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full uppercase">
              Plano {planDetails?.name || user?.plan}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                E-mail (gerenciado pelo Neon Auth)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Limites do seu plano
              </label>
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  Cards próprios:{' '}
                  {planDetails?.limits?.ownCards === null
                    ? 'Ilimitados'
                    : planDetails?.limits?.ownCards ?? 50}{' '}
                  • Simulados/mês:{' '}
                  {planDetails?.limits?.quizAttemptsPerMonth === null
                    ? 'Ilimitados'
                    : planDetails?.limits?.quizAttemptsPerMonth ?? 5}
                </span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Alteração de senha via Neon Auth */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3>Alterar Senha</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="password"
            required
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
          />
          <input
            type="password"
            required
            placeholder="Nova senha (mín. 8 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
          />
        </div>

        {passwordMsg && (
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{passwordMsg}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm"
          >
            Atualizar Senha
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
