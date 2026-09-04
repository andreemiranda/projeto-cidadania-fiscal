import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pesquisa de Cidadania Fiscal - UNITINS',
  description: 'Formulário de pesquisa extensionista sobre cidadania fiscal da UNITINS / UAB Polo Pedro Afonso com autenticação Google e painel administrativo.',
  openGraph: {
    title: 'Pesquisa de Cidadania Fiscal - UNITINS',
    description: 'Formulário de pesquisa extensionista sobre cidadania fiscal da UNITINS / UAB Polo Pedro Afonso com autenticação Google e painel administrativo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pesquisa de Cidadania Fiscal - UNITINS',
    description: 'Formulário de pesquisa extensionista sobre cidadania fiscal da UNITINS / UAB Polo Pedro Afonso com autenticação Google e painel administrativo.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className={`min-h-screen bg-slate-50 text-slate-900 antialiased ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
