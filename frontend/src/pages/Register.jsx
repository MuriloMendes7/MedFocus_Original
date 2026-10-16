import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  const { signUp } = useAuth();
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

  if (verificationPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Confirme seu e-mail
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enviamos um link/código de confirmação para <strong>{formData.email}</strong>. Após
            confirmar, faça login para acessar a plataforma.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-xl w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="text-center">
          <Link to="/">
            <img src="/assets/medfocus-logo.png" alt="MedFocus" className="mx-auto h-12 w-auto" />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
            Criar sua conta
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Comece gratuitamente e sincronize seus estudos na nuvem
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="name"
              label="Nome completo"
              icon={<User className="h-5 w-5" />}
              placeholder="Seu nome"
              value={formData.name}
              onChange={handleChange}
            />
            <InputField
              id="email"
              label="E-mail"
              type="email"
              icon={<Mail className="h-5 w-5" />}
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <InputField
                id="phone"
                label="Telefone / WhatsApp (opcional)"
                required={false}
                icon={<Phone className="h-5 w-5" />}
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <InputField
              id="password"
              label="Senha (mín. 8 caracteres)"
              type="password"
              icon={<Lock className="h-5 w-5" />}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            <InputField
              id="confirmPassword"
              label="Confirmar senha"
              type="password"
              icon={<Lock className="h-5 w-5" />}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center font-semibold bg-red-50 dark:bg-red-950/40 py-2.5 px-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center py-4 px-4 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'Criando conta...' : 'Criar Conta'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
              Faça login aqui
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
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <div className="mt-1 relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        {icon}
      </div>
      <input
        id={id}
        type={type}
        required={required}
        className="block w-full pl-11 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

export default Register;
