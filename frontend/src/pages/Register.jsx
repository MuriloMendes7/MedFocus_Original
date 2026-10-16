import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MedFocusLogo from '../components/MedFocusLogo';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const { signUp, loginAsDemo, isNeonAuthConfigured } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const { profile, requiresEmailVerification } = await signUp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });
      if (requiresEmailVerification) {
        setVerificationPending(true);
      } else if (profile) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAccess = async (role = 'student') => {
    await loginAsDemo(role);
    navigate('/dashboard', { replace: true });
  };

  if (verificationPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121615] px-4 py-12 transition-colors">
        <div className="max-w-md w-full bg-[#FFFFFF] dark:bg-[#18211E] p-8 sm:p-10 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] text-center space-y-4 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-[#2D6A4F] mx-auto" />
          <h2 className="text-2xl font-serif text-[#172622] dark:text-[#F1F5F3]">
            Confirme seu e-mail
          </h2>
          <p className="text-sm text-[#5D6D67] dark:text-[#90A29A] leading-relaxed">
            Enviamos um link de confirmação para <strong>{formData.email}</strong>. Após confirmar, você poderá acessar o ambiente de estudos.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 rounded-xl bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] font-medium text-sm transition"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121615] px-4 py-12 transition-colors">
      <div className="max-w-xl w-full space-y-6 bg-[#FFFFFF] dark:bg-[#18211E] p-8 sm:p-10 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-sm">
        <div className="text-center flex flex-col items-center">
          <Link to="/" className="mb-4">
            <MedFocusLogo size="lg" showBadge={false} />
          </Link>
          <h2 className="text-2xl font-serif text-[#172622] dark:text-[#F1F5F3]">
            Criar sua conta de estudos
          </h2>
          <p className="mt-1 text-xs text-[#6A7B74] dark:text-[#93A59E]">
            Repetição espaçada com rigor acadêmico e sem ruído visual
          </p>
        </div>

        {/* Bloco de Acesso Rápido para Teste Local */}
        <div className="p-4 rounded-xl bg-[#F4F1EA] dark:bg-[#1D2723] border border-[#DDD6C8] dark:border-[#2E3F37] space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#35574A] dark:text-[#A1C5B5] font-semibold">
            Modo de Demonstração Local
          </span>
          <p className="text-xs text-[#5D6D67] dark:text-[#90A29A] leading-relaxed">
            Prefere testar imediatamente sem cadastrar e-mail? Entre como estudante demonstrativo:
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleDemoAccess('student')}
              className="w-full py-2.5 px-3 rounded-lg bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] font-medium text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Acessar Ambiente de Demonstração</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isNeonAuthConfigured && (
          <div className="p-3.5 rounded-xl bg-[#F7F4EC] dark:bg-[#1C2522] border border-[#DFD8CC] dark:border-[#2E3C36] text-[#697A73] dark:text-[#95A7A0] text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 text-[#A87B2E] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Banco Local / Offline:</strong> Use o botão de demonstração acima para testar todos os baralhos e simulados com persistência no navegador.
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E5DFD4] dark:border-[#293630] w-full" />
          <span className="bg-[#FFFFFF] dark:bg-[#18211E] px-3 text-[11px] font-mono uppercase text-[#889892] absolute">
            Ou registre seus dados
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="name"
              label="Nome completo"
              icon={<User className="h-4 w-4" />}
              placeholder="Dr. Carlos Silva"
              value={formData.name}
              onChange={handleChange}
            />
            <InputField
              id="email"
              label="E-mail acadêmico ou pessoal"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              placeholder="carlos.silva@exemplo.com"
              value={formData.email}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <InputField
                id="phone"
                label="WhatsApp / Telefone (opcional)"
                required={false}
                icon={<Phone className="h-4 w-4" />}
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <InputField
              id="password"
              label="Senha (mín. 8 caracteres)"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            <InputField
              id="confirmPassword"
              label="Confirmar senha"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="text-[#A13A28] dark:text-[#E27D60] text-xs font-medium bg-[#FBF0EE] dark:bg-[#2A1D1A] py-2.5 px-3 rounded-lg border border-[#F2D0C8] dark:border-[#4B2922]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg text-[#FAF8F5] bg-[#1A3835] hover:bg-[#254F4A] transition disabled:opacity-50"
          >
            {submitting ? 'Criando conta...' : 'Cadastrar e Começar a Estudar'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#6A7B74] dark:text-[#93A59E]">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-semibold text-[#1A3835] dark:text-[#A1C5B5] hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  id,
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = true,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-[#4D5D57] dark:text-[#A1B3AC] mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9B94]">
        {icon}
      </div>
      <input
        id={id}
        type={type}
        required={required}
        className="block w-full pl-10 pr-3 py-2.5 border border-[#D5CDC0] dark:border-[#2E3E37] rounded-lg bg-[#FAF8F5] dark:bg-[#141B18] text-[#1C2A26] dark:text-[#EAEFEA] placeholder-[#9AA8A1] focus:outline-none focus:border-[#1A3835] dark:focus:border-[#4B7363] text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

export default Register;
