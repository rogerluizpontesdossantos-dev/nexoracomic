'use client';

import { useState } from 'react';

export default function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    // Newsletter do rodapé é exibida como "em breve" até a integração com um
    // provedor de email (ex.: Brevo/Mailchimp) ser configurada.
    await new Promise((r) => setTimeout(r, 300));
    setSubmitted(true);
    setEmail('');
    setLoading(false);
  };

  if (submitted) {
    return (
      <p className="text-sm text-green-400">
        ✉️ Registrado! A newsletter será ativada em breve.
      </p>
    );
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu email"
        required
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        aria-label="Email para newsletter"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Inscrever-se'}
      </button>
    </form>
  );
}
