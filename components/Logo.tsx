import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  return (
    <Link href="/" className="group flex flex-col" aria-label="NexoraComic - Página inicial">
      <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
        <img 
          src="/logo-icon.svg" 
          alt="" 
          className="h-full w-auto"
          aria-hidden="true"
        />
        <div className="font-bold tracking-tight">
          <span className="text-white group-hover:text-zinc-300 transition-colors">Nexora</span>
          <span className="text-[#d4af37] group-hover:text-[#f4d03f] transition-colors">Comic</span>
        </div>
      </div>
      {showTagline && (
        <span className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors hidden sm:block">
          Ciência • Tecnologia • Cultura Geek
        </span>
      )}
    </Link>
  );
}
