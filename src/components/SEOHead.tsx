
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "La Fréquence du Vivant - Œuvre bioacoustique interactive par Gaspard Boréal",
  description = "Marches techno-sensibles entre humain, machine et nature. Géopoétique augmentée, bioacoustique poétique et transition agroécologique. Observatoire prospectif 2025-2037.",
  keywords = "bioacoustique poétique, marches techno-sensibles, géopoétique augmentée, Gaspard Boréal, art-IA-vivant, transition agroécologique, poésie prospective, mondes hybrides, observatoire poétique",
  canonical = "https://la-frequence-du-vivant.lovable.app/"
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Gaspard Boréal" />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="La Fréquence du Vivant" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:creator" content="@GaspardBoreal" />
      
      {/* Liens vers le site auteur */}
      <link rel="author" href="https://www.gaspardboreal.com/" />
      <link rel="alternate" hreflang="fr" href="https://www.gaspardboreal.com/frequence-du-vivant" />
      
      {/* Schema.org pour les données structurées */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": "La Fréquence du Vivant",
          "author": {
            "@type": "Person",
            "name": "Gaspard Boréal",
            "url": "https://www.gaspardboreal.com/"
          },
          "description": description,
          "genre": ["Poésie contemporaine", "Art numérique", "Bioacoustique"],
          "keywords": keywords,
          "url": canonical,
          "inLanguage": "fr",
          "datePublished": "2025-08-15",
          "publisher": {
            "@type": "Organization",
            "name": "Observatoire Poétique des Mondes Hybrides",
            "url": "https://www.gaspardboreal.com/"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
