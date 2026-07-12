
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

const SITE_ORIGIN = 'https://la-frequence-du-vivant.com';
const DEFAULT_OG = `${SITE_ORIGIN}/og-image.jpg`;

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'La Fréquence du Vivant — Bioacoustique & Poésie',
  description = 'Observatoire poétique de Gaspard Boréal : bioacoustique, art & IA, transition agroécologique.',
  keywords = 'bioacoustique poétique, géopoétique, marches techno-sensibles, Gaspard Boréal, fréquences du vivant',
  author = 'Gaspard Boréal',
  ogImage,
  canonicalUrl = `${SITE_ORIGIN}/`,
}) => {
  const resolvedOg = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${SITE_ORIGIN}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`)
    : DEFAULT_OG;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedOg} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="La Fréquence du Vivant" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOg} />

      <link rel="canonical" href={canonicalUrl} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'La Fréquence du Vivant',
          url: SITE_ORIGIN + '/',
          inLanguage: 'fr',
          author: {
            '@type': 'Person',
            name: 'Gaspard Boréal',
            url: 'https://www.gaspardboreal.com',
          },
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
