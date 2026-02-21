import { Helmet } from 'react-helmet-async';

interface SEOProps {
  // Base
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  
  // Advanced Document Metas
  canonicalUrl?: string;
  keywords?: string[];
  authorName?: string;
  creator?: string;
  publisher?: string;
  robots?: string; // Example: 'index, follow'
  formatDetection?: string; // Example: 'telephone=no, address=no, email=no'
  
  // Advanced Open Graph (OG)
  ogSiteName?: string;
  ogLocale?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;

  // Advanced Twitter
  twitterCreator?: string; // e.g. '@BeHalix'
  twitterSite?: string;

  // Verification
  googleVerification?: string;
  bingVerification?: string;

  // Structured Data
  jsonLd?: string | string[]; // Can be an array of JSON strings or a single JSON string
}

export const SEO = ({
  title,
  description,
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  canonicalUrl,
  keywords,
  authorName,
  creator,
  publisher,
  robots = 'index, follow',
  formatDetection = 'telephone=no, address=no, email=no',
  ogSiteName = 'BeHalix',
  ogLocale = 'en_US',
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt = 'BeHalix image',
  googleVerification,
  bingVerification,
  jsonLd,
}: SEOProps) => {
  return (
    <Helmet>
      {/* ── Standard SEO ───────────────────────────────── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content="#FF6B6B" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta name="robots" content={robots} />
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {authorName && <meta name="author" content={authorName} />}
      {creator && <meta name="creator" content={creator} />}
      {publisher && <meta name="publisher" content={publisher} />}
      <meta name="format-detection" content={formatDetection} />
      
      {googleVerification && <meta name="google-site-verification" content={googleVerification} />}
      {bingVerification && <meta name="msvalidate.01" content={bingVerification} />}

      {/* ── Open Graph ─────────────────────────────────── */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={ogSiteName} />
      <meta property="og:locale" content={ogLocale} />
      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta property="og:image:width" content={String(imageWidth)} />
          <meta property="og:image:height" content={String(imageHeight)} />
          <meta property="og:image:alt" content={imageAlt} />
        </>
      )}

      {/* ── Twitter ────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* ── Structured Data ────────────────────────────── */}
      {jsonLd && (
        Array.isArray(jsonLd) 
          ? jsonLd.map((script, idx) => <script key={idx} type="application/ld+json">{script}</script>) 
          : <script type="application/ld+json">{jsonLd}</script>
      )}
    </Helmet>
  );
};
