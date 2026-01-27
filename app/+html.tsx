import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no" />
        
        {/* Primary Meta Tags */}
        <title>AFTR - Todo empieza antes de entrar al club</title>
        <meta name="title" content="AFTR - Todo empieza antes de entrar al club" />
        <meta name="description" content="Encuentra y organiza previas y afters para eventos y fiestas. Conecta con otros asistentes antes y despues del club." />
        <meta name="keywords" content="previas, afters, fiestas, eventos, club, discoteca, noche, salir, quedadas, fiesta previa, after party, Madrid, Barcelona, Espana" />
        <meta name="author" content="AFTR" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Spanish" />
        <meta name="theme-color" content="#000000" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aftr.es/" />
        <meta property="og:title" content="AFTR - Todo empieza antes de entrar al club" />
        <meta property="og:description" content="Encuentra y organiza previas y afters para eventos y fiestas. Conecta con otros asistentes antes y despues del club." />
        <meta property="og:image" content="https://aftr.es/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="AFTR" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://aftr.es/" />
        <meta property="twitter:title" content="AFTR - Todo empieza antes de entrar al club" />
        <meta property="twitter:description" content="Encuentra y organiza previas y afters para eventos y fiestas. Conecta con otros asistentes antes y despues del club." />
        <meta property="twitter:image" content="https://aftr.es/og-image.png" />
        
        {/* Apple */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AFTR" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://aftr.es/" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              'name': 'AFTR',
              'description': 'Encuentra y organiza previas y afters para eventos y fiestas. Conecta con otros asistentes antes y despues del club.',
              'url': 'https://aftr.es',
              'applicationCategory': 'SocialNetworkingApplication',
              'operatingSystem': 'Web, iOS, Android',
              'offers': {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'EUR'
              },
              'author': {
                '@type': 'Organization',
                'name': 'AFTR'
              },
              'inLanguage': 'es'
            })
          }}
        />

        <ScrollViewStyleReset />

        {/* Critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const criticalCSS = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: #000;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

* {
  -webkit-tap-highlight-color: transparent;
}
`;
