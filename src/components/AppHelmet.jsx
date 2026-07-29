import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function AppHelmet({ title, description, location }) {
  const siteTitle = 'PowerKing Tips';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription =
    'Expert football predictions and betting tips. Win more with PowerKing Tips.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta property="og:title" content={fullTitle} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      <meta property="og:type" content="website" />
      <meta
        property="og:url"
        content={`https://powerking-tips.onrender.com${location || ''}`}
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta
        name="twitter:description"
        content={description || defaultDescription}
      />
      {location && (
        <link
          rel="canonical"
          href={`https://powerking-tips.onrender.com${location}`}
        />
      )}
    </Helmet>
  );
}
