import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'Olympiad Prep by Techsei',
  description: 'Olympiad practice tests — Techsei',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
