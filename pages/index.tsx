import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Coffee Recipes</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container flex-1 flex mx-auto p-4">
        <h1 className="font-bold text-3xl">Coffee Recipes</h1>
      </main>
    </div>
  )
}
