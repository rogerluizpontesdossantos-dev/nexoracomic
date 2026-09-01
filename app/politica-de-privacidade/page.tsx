import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade da NexoraComic. Saiba como coletamos, usamos e protegemos seus dados pessoais.',
  alternates: {
    canonical: '/politica-de-privacidade',
  },
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-sm text-muted-foreground">
              Última atualização: 15 de janeiro de 2024
            </p>
            
            <p>
              Esta Política de Privacidade descreve como a NexoraComic coleta, usa e protege suas informações pessoais.
            </p>
            
            <h2>1. Informações que Coletamos</h2>
            <h3>1.1 Informações que Você Fornece</h3>
            <ul>
              <li>Endereço de email (quando você se inscreve na newsletter)</li>
              <li>Nome (quando você entra em contato conosco)</li>
              <li>Mensagem (quando você entra em contato conosco)</li>
            </ul>
            
            <h3>1.2 Informações Coletadas Automaticamente</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador e versão</li>
              <li>Sistema operacional</li>
              <li>Páginas visitadas e tempo gasto no site</li>
            </ul>
            
            <h2>2. Como Usamos Suas Informações</h2>
            <ul>
              <li>Enviar newsletters e atualizações (com seu consentimento)</li>
              <li>Responder às suas perguntas e solicitações</li>
              <li>Melhorar a qualidade do nosso conteúdo</li>
              <li>Analisar o tráfego do site</li>
              <li>Proteger contra fraudes e abuso</li>
            </ul>
            
            <h2>3. Compartilhamento de Informações</h2>
            <p>
              Não vendemos suas informações pessoais. Podemos compartilhar informações apenas:
            </p>
            <ul>
              <li>Com provedores de serviços confiáveis para operar nosso site</li>
              <li>Quando exigido por lei</li>
              <li>Para proteger nossos direitos e propriedade</li>
            </ul>
            
            <h2>4. Cookies</h2>
            <p>
              Usamos cookies para melhorar sua experiência de navegação, analisar o tráfego do site e personalizar conteúdo. Você pode configurar seu navegador para recusar cookies.
            </p>
            
            <h2>5. Seus Direitos</h2>
            <p>
              Você tem o direito de:
            </p>
            <ul>
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir informações imprecisas</li>
              <li>Excluir suas informações pessoais</li>
              <li>Revogar consentimento</li>
              <li>Optar por não receber comunicações de marketing</li>
            </ul>
            
            <h2>6. Segurança</h2>
            <p>
              Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado, alteração ou destruição.
            </p>
            
            <h2>7. Contato</h2>
            <p>
              Para questões sobre esta política de privacidade, entre em contato através da nossa{' '}
              <Link href="/contato" className="text-primary hover:underline">página de contato</Link>.
            </p>
            
            <div className="bg-card/50 border border-border p-4 rounded-lg text-sm text-muted-foreground">
              <p>
                <strong>Nota:</strong> Esta é uma política de privacidade modelo e deve ser revisada por um profissional jurídico antes de ser publicada oficialmente.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
