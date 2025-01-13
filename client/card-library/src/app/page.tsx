import Link from 'next/link';
export default function Home() {
  return (
    <div id="root">
      Witam na giga elo turbo mega card library
      <div id='start-page'>
        <Link href="/registration">Registration</Link>
        <Link href="/login">Login</Link>
      </div>
    </div>
  )
}
