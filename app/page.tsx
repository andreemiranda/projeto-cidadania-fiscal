import { redirect } from 'next/navigation';

const REDIRECT_URL = 'https://cidadania-fiscal-unitins--cidadaniafiscal.replit.app/';

export default function HomePage() {
  redirect(REDIRECT_URL);
}
