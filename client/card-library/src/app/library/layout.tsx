import "../globals.css";
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
                    <Link href="/login">Login</Link>
                    <Link href="/users">Users</Link>
                    <Link href="/library">Library</Link>
                    <Link href="/decks">Decks</Link>
                </div>
                <div id="search-bar">
                    <span id="card-search">
                        <input type="field" placeholder="card..."></input>
                        <button className="search-button" id="button-search-card">
                            search
                        </button>
                    </span>
                </div>
                {children}
            </body>
        </html>
    );
}
