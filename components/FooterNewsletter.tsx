'use client';

import { useState } from 'react';

export default function FooterNewsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // TODO: Integrate with email provider
      setEmail('');
      alert('Obrigado por se inscrever! Verifique seu email para confirmar.');
    }
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu email"
        required
        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Email para newsletter"
      />
      <button
        type="submit"
        className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Inscrever-se
      </button>
    </form>
  );
}
