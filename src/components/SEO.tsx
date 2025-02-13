import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  type?: string;
  name?: string;
}

export function SEO({ title, description, type = 'website', name = 'Jezweb Knowledge Base' }: SEOProps) {
  const fullTitle = `${title} | ${name}`;
  
  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}