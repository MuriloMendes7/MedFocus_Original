import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authClient } from '../lib/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (!authClient) {
        throw new Error('Defina VITE_NEON_AUTH_URL no arquivo frontend/.env.');
      }
      const { error: resetError } = await authClient.forgetPassword({
        email: email.trim(),
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw new Error(resetError.message);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </Link>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Verifique seu e-mail
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Se existir uma conta associada a <strong>{email}</strong>, você receberá um link para
              redefinir sua senha em instantes.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Recuperar senha
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Informe seu e-mail cadastrado para receber o link de redefinição.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white sm:text-sm"
                />
              </div>

              {error && (
                <div className="text-red-600 text-xs font-semibold bg-red-50 dark:bg-red-950/40 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
