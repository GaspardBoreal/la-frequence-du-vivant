
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

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "La Fréquence du Vivant - Œuvre bioacoustique interactive par Gaspard Boréal",
  description = "Explorez les territoires hybrides entre humain, machine et nature. Marches techno-sensibles, géopoétique augmentée et bioacoustique poétique. Une création de Gaspard Boréal.",
  keywords = "bioacoustique poétique, géopoétique augmentée, marches techno-sensibles, poésie prospective, art-IA-vivant, transition agroécologique littéraire, Gaspard Boréal, observatoire poétique hybride, fréquences du vivant",
  author = "Gaspard Boréal",
  ogImage = "https://la-frequence-du-vivant.lovable.app/og-image.jpg",
  canonicalUrl = "https://la-frequence-du-vivant.lovable.app"
}) => {
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
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="La Fréquence du Vivant" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang for cross-site SEO */}
      <link rel="alternate" hrefLang="fr" href="https://la-frequence-du-vivant.lovable.app" />
      <link rel="alternate" hrefLang="fr" href="https://www.gaspardboreal.com" />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": "La Fréquence du Vivant",
          "author": {
            "@type": "Person",
            "name": "Gaspard Boréal",
            "url": "https://www.gaspardboreal.com"
          },
          "description": description,
          "url": canonicalUrl,
          "genre": ["Poésie contemporaine", "Art numérique", "Bioacoustique"],
          "keywords": keywords
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
