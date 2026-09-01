import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Termos de Uso | NexoraComic',
  description: 'Termos de uso da NexoraComic. Leia nossos termos e condições antes de usar nosso site.',
  alternates: {
    canonical: 'https://nexoracomic.com/termos-de-uso',
  },
};

export default function TermosUsoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
            
            <p>
              Ao acessar e usar o site NexoraComic, você concorda com estes Termos de Uso. Se você não concordar com estes termos, por favor não use nosso site.
            </p>
            
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao usar este site, você declara que tem idade legal para contratar e concorda em cumprir estes termos. Se você não concordar com qualquer parte destes termos, você não deve usar nosso site.
            </p>
            
            <h2>2. Uso do Site</h2>
            <h3>2.1 Uso Permitido</h3>
            <ul>
              <li>Acessar e ler nosso conteúdo para fins pessoais e não comerciais</li>
              <li>Compartilhar links para nosso conteúdo</li>
              <li>Inscrever-se na newsletter</li>
              <li>Entrar em contato conosco</li>
            </ul>
            
            <h3>2.2 Uso Proibido</h3>
            <ul>
              <li>Copiar, reproduzir ou distribuir nosso conteúdo sem permissão</li>
              <li>Usar o site para fins ilegais ou não autorizados</li>
              <li>Tentar hackear, danificar ou interromper o funcionamento do site</li>
              <li>Coletar dados de usuários sem autorização</li>
              <li>Usar bots ou scrapers para coletar conteúdo</li>
            </ul>
            
            <h2>3. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do NexoraComic, incluindo textos, imagens, gráficos, logotipos e design, é protegido por direitos autorais e outras leis de propriedade intelectual.
            </p>
            
            <h3>3.1 Conteúdo</h3>
            <p>
              Você não pode copiar, modificar, distribuir ou usar nosso conteúdo sem permissão escrita, exceto conforme permitido por lei ou com nosso consentimento explícito.
            </p>
            
            <h3>3.2 Marca</h3>
            <p>
              O nome NexoraComic e nosso logotipo são marcas registradas. Você não pode usar nossa marca sem permissão.
            </p>
            
            <h2>4. Conteúdo de Terceiros</h2>
            <p>
              Nosso site pode conter links para sites de terceiros. Não somos responsáveis pelo conteúdo ou práticas de privacidade desses sites. Recomendamos que você revise os termos de uso e políticas de privacidade de qualquer site que visitar.
            </p>
            
            <h2>5. Limitação de Responsabilidade</h2>
            <p>
              O NexoraComic não garante que o site funcionará sem interrupções ou erros. O site é fornecido &quot;como está&quot; sem garantias de qualquer tipo. Não somos responsáveis por danos diretos, indiretos, incidentais ou consequentes resultantes do uso do site.
            </p>
            
            <h2>6. Isenção de Responsabilidade</h2>
            <p>
              O conteúdo do NexoraComic é apenas para fins informativos e educacionais. Não constitui aconselhamento profissional. Sempre consulte especialistas qualificados para questões específicas.
            </p>
            
            <h2>7. Newsletter</h2>
            <p>
              Ao se inscrever na newsletter, você concorda em receber emails do NexoraComic. Você pode cancelar sua inscrição a qualquer momento através do link de cancelamento incluído em cada email.
            </p>
            
            <h2>8. Alterações nos Termos</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações entram em vigor imediatamente após a publicação no site. Seu uso contínuo do site após alterações constitui aceitação dos novos termos.
            </p>
            
            <h2>9. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis do Brasil. Quaisquer disputas serão resolvidas nos tribunais brasileiros.
            </p>
            
            <h2>10. Contato</h2>
            <p>
              Para questões sobre estes termos, entre em contato: contato@nexoracomic.com
            </p>
            
            <div className="bg-card/50 border border-border p-4 rounded-lg text-sm text-muted-foreground">
              <p>
                <strong>Nota:</strong> Estes são termos de uso modelo e devem ser revisados por um profissional jurídico antes de serem publicados oficialmente.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
