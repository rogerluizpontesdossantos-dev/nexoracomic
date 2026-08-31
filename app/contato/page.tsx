import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contato | NexoraComic',
  description: 'Entre em contato com a equipe da NexoraComic para dúvidas, sugestões ou parcerias.',
  alternates: {
    canonical: 'https://nexoracomic.com/contato',
  },
};

export default function ContatoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Contato</h1>
          
          <ContactForm />
          
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold mb-4">Outras Formas de Contato</h2>
            <p className="text-muted-foreground mb-4">
              TODO: Adicionar informações de contato reais quando disponíveis
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: contato@nexoracomic.com</li>
              <li>Redes Sociais: TODO</li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
