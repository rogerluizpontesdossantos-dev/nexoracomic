'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && consent) {
      // Newsletter é exibida como "em breve" até a integração com um
      // provedor de email (ex.: Brevo/Mailchimp) ser configurada.
      setSubmitted(true);
      setTimeout(() => {
        setEmail('');
        setConsent(false);
        setSubmitted(false);
      }, 6000);
    }
  };

  return (
    <section className="bg-card/50 border-y border-border py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Receba as melhores histórias de ciência e tecnologia
          </h2>
          <p className="text-muted-foreground mb-6">
            Inscreva-se na nossa newsletter e receba artigos selecionados diretamente no seu email.
          </p>
          
          {submitted ? (
            <div className="bg-primary/10 border border-primary text-primary px-6 py-4 rounded-lg">
              Recebemos seu interesse! Nossa newsletter está sendo preparada e você receberá o primeiro email assim que for lançada.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Email para newsletter"
                />
                <button
                  type="submit"
                  disabled={!email || !consent}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Inscrever-se
                </button>
              </div>
              
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-1"
                />
                <span>
                  Concordo em receber emails da NexoraComic e aceito a{' '}
                  <Link href="/politica-de-privacidade" className="text-primary hover:underline">
                    política de privacidade
                  </Link>
                  .
                </span>
              </label>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
