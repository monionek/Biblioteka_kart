import "./globals.css";
import Link from 'next/link';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="nav-bar">
          <Link href="/">Home</Link>
          <Link href="/registration">Registration</Link>
          <Link href="/login">Login</Link>
          <Link href="/users">Users</Link>
          <Link href="/library">Library</Link>
          <Link href="/library/add-card">Add new Card</Link>
          <Link href="/decks">Decks</Link>
        </div>
        {children}
      </body>
    </html>
  );
}
