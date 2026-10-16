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
      <div className="pb-4 border-b border-[#E8E2D6] dark:border-[#24312B]">
        <h1 className="text-2xl md:text-3xl font-serif text-[#172622] dark:text-[#F1F5F3] tracking-tight">
          Configurações de Perfil
        </h1>
        <p className="text-[#6A7B74] dark:text-[#93A59E] text-xs md:text-sm mt-1">
          Gerencie suas informações pessoais, plano de assinatura e segurança da conta.
        </p>
      </div>

      <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs overflow-hidden">
        <div className="p-7 bg-[#1A3835] text-[#FAF8F5] flex flex-col sm:flex-row sm:items-center gap-5 border-b border-[#254F4A]">
          <div className="w-16 h-16 rounded-xl bg-[#254F4A] border border-[#3B6955] flex items-center justify-center text-2xl font-serif text-[#FAF8F5]">
            {(user?.name || user?.email || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-serif">{user?.name || 'Estudante'}</h3>
            <p className="text-[#A1C5B5] text-xs font-mono">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#FAF8F5]/10 text-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider rounded-md border border-[#FAF8F5]/20">
              Plano {planDetails?.name || user?.plan}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9] mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#889892] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9] mb-1">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#889892] absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F4F1EA] dark:bg-[#1F2B26] border border-[#DDD6C8] dark:border-[#2A3731] rounded-lg text-sm text-[#889892] cursor-not-allowed font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9] mb-1">
                WhatsApp / Telefone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#889892] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9] mb-1">
                Limites do seu plano
              </label>
              <div className="px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg text-xs font-mono text-[#5D6D67] dark:text-[#A1C5B5] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1A3835] dark:text-[#A1C5B5] shrink-0" />
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
            <div className="flex items-center gap-2 text-xs font-medium text-[#24503F] dark:text-[#8EBFAC] bg-[#EDF3EF] dark:bg-[#1E2E27] p-2.5 rounded-lg border border-[#CFDFD7] dark:border-[#2F493E]">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] px-5 py-2.5 rounded-lg font-medium text-xs transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Alteração de senha via Neon Auth */}
      <form
        onSubmit={handleChangePassword}
        className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-7 border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-[#172622] dark:text-[#F1F5F3]">
          <Lock className="w-4 h-4 text-[#1A3835] dark:text-[#A1C5B5]" />
          <h3 className="font-serif text-base">Alterar Senha</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="password"
            required
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
          />
          <input
            type="password"
            required
            placeholder="Nova senha (mín. 8 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
          />
        </div>

        {passwordMsg && (
          <p className="text-xs font-mono text-[#1A3835] dark:text-[#A1C5B5]">{passwordMsg}</p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] hover:bg-[#F4F1EA] text-[#172622] dark:text-[#F1F5F3] font-medium text-xs transition"
          >
            Atualizar Senha
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
