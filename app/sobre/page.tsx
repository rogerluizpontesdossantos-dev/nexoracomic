import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Sobre',
  description: 'Conheça a NexoraComic - uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.',
  alternates: {
    canonical: '/sobre',
  },
};

export default function SobrePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Sobre a NexoraComic</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <p>
              A NexoraComic é uma publicação digital dedicada a explorar a intersecção entre ciência, tecnologia e cultura geek. Nossa missão é tornar conceitos científicos complexos acessíveis e envolventes, conectando o universo acadêmico com o público geral.
            </p>
            
            <h2>Nossa Missão</h2>
            <p>
              Democratizar o conhecimento científico e tecnológico, criando conteúdo de qualidade que inspire curiosidade e promova o pensamento crítico.
            </p>
            
            <h2>O Que Cobrimos</h2>
            <ul>
              <li><strong>Ciência:</strong> Biologia, física, química, neurociência e descobertas científicas</li>
              <li><strong>Tecnologia:</strong> Gadgets, computação, cibersegurança, robótica e tecnologia futura</li>
              <li><strong>Espaço:</strong> Astronomia, missões espaciais, planetas e exploração cósmica</li>
              <li><strong>Inteligência Artificial:</strong> IA generativa, machine learning e o futuro da computação</li>
              <li><strong>Cultura Geek:</strong> Games, filmes de ficção científica, quadrinhos e curiosidades</li>
            </ul>
            
            <h2>Nossos Valores</h2>
            <ul>
              <li><strong>Precisão:</strong> Todo conteúdo é baseado em fontes confiáveis e verificadas</li>
              <li><strong>Acessibilidade:</strong> Explicamos conceitos complexos de forma clara</li>
              <li><strong>Originalidade:</strong> Conteúdo único e bem pesquisado</li>
              <li><strong>Transparência:</strong> Sempre citamos nossas fontes</li>
            </ul>
            
            <h2>Contato</h2>
            <p>
              Para dúvidas, sugestões ou parcerias, entre em contato através da nossa página de contato.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
