interface AdSlotProps {
  slot: string;
  size?: 'banner' | 'rectangle' | 'skyscraper';
  className?: string;
}

/**
 * AdSense Ad Slot Component
 * 
 * This component is DISABLED by default until AdSense approval is received.
 * To enable ads:
 * 1. Get AdSense approval from Google
 * 2. Add your AdSense publisher ID to environment variables
 * 3. Set ENABLE_ADS=true in environment variables
 * 4. Replace the placeholder with actual AdSense code
 * 
 * NEVER enable ads before official approval.
 * NEVER place ads over navigation or buttons.
 * NEVER make ads look like content.
 */

export default function AdSlot({ slot, size = 'banner', className = '' }: AdSlotProps) {
  // Ads are disabled by default
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';

  if (!adsEnabled) {
    return null;
  }

  const sizeClasses = {
    banner: 'w-full h-24 md:h-28',
    rectangle: 'w-full h-64 md:h-96',
    skyscraper: 'w-32 h-full md:w-48',
  };

  return (
    <div
      className={`flex items-center justify-center bg-card/30 border border-border ${sizeClasses[size]} ${className}`}
      data-ad-slot={slot}
      aria-label="Publicidade"
    >
      {/* 
        TODO: Replace with actual AdSense code when approved
        Example:
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
      <span className="text-xs text-muted-foreground">Espaço reservado para publicidade</span>
    </div>
  );
}
