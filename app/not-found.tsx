import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Página não encontrada</h2>
      <p className="text-sm text-slate-600 mb-6">A página que você procura não existe ou foi movida.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition"
      >
        <Home className="w-4 h-4" />
        <span>Voltar ao Início</span>
      </Link>
    </div>
  );
}
