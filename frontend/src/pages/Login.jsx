import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MedFocusLogo from '../components/MedFocusLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, signIn, loginAsDemo, isNeonAuthConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAccess = async (role = 'student') => {
    setError('');
    await loginAsDemo(role);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121615] px-4 py-12 transition-colors">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] dark:bg-[#18211E] p-8 sm:p-10 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-sm">
        <div className="text-center flex flex-col items-center">
          <Link to="/" className="mb-4">
            <MedFocusLogo size="lg" showBadge={false} />
          </Link>
          <h2 className="text-2xl font-serif text-[#172622] dark:text-[#F1F5F3]">
            Acessar sua conta
          </h2>
          <p className="mt-1 text-xs text-[#6A7B74] dark:text-[#93A59E]">
            Retome suas revisões agendadas com serenidade
          </p>
        </div>

        {/* Bloco de Acesso Rápido para Teste Local */}
        <div className="p-4 rounded-xl bg-[#F4F1EA] dark:bg-[#1D2723] border border-[#DDD6C8] dark:border-[#2E3F37] space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#35574A] dark:text-[#A1C5B5] font-semibold">
            Modo de Demonstração Local
          </span>
          <p className="text-xs text-[#5D6D67] dark:text-[#90A29A] leading-relaxed">
            Acesse o ambiente completo com baralhos clínicos e simulados pré-carregados:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoAccess('student')}
              className="py-2.5 px-3 rounded-lg bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] font-medium text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Entrar como Aluno</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccess('admin')}
              className="py-2.5 px-3 rounded-lg bg-[#FAF8F5] dark:bg-[#161D1A] text-[#1C2C28] dark:text-[#E8EFEA] border border-[#DDD6C8] dark:border-[#2C3B34] hover:bg-[#EAE5DB] font-medium text-xs transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#527063]" />
              <span>Entrar como Admin</span>
            </button>
          </div>
        </div>

        {!isNeonAuthConfigured && (
          <div className="p-3.5 rounded-xl bg-[#F7F4EC] dark:bg-[#1C2522] border border-[#DFD8CC] dark:border-[#2E3C36] text-[#697A73] dark:text-[#95A7A0] text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 text-[#A87B2E] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Modo Autônomo Ativo:</strong> Você pode navegar e testar 100% das funcionalidades localmente utilizando os botões de demonstração acima.
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E5DFD4] dark:border-[#293630] w-full" />
          <span className="bg-[#FFFFFF] dark:bg-[#18211E] px-3 text-[11px] font-mono uppercase text-[#889892] absolute">
            Ou com e-mail
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-[#4D5D57] dark:text-[#A1B3AC] mb-1">
              E-mail cadastrado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A9B94]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                className="block w-full pl-9 pr-3 py-2.5 border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835] dark:focus:border-[#4B7363]"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#4D5D57] dark:text-[#A1B3AC]">
                Senha
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#35584C] dark:text-[#97BFB0] hover:underline"
              >
                Esqueci a senha
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A9B94]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="block w-full pl-9 pr-10 py-2.5 border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835] dark:focus:border-[#4B7363]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A9B94] hover:text-[#52635D]"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-[#8E3B2D] dark:text-[#DF7D6F] text-xs font-medium bg-[#FAEDE9] dark:bg-[#251A18] py-2 px-3 rounded-lg border border-[#ECCAC2] dark:border-[#422622]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 text-xs font-semibold rounded-lg text-[#FAF8F5] bg-[#1A3835] hover:bg-[#254F4A] dark:bg-[#284944] dark:hover:bg-[#325A54] transition disabled:opacity-50"
          >
            {submitting ? 'Acessando...' : 'Entrar na Plataforma'}
          </button>
        </form>

        <div className="text-center pt-1">
          <p className="text-xs text-[#6A7B74] dark:text-[#8D9F98]">
            Não possui cadastro?{' '}
            <Link to="/register" className="font-semibold text-[#1A3835] dark:text-[#D5E3DD] hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
