import Head from 'next/head'
import { useQuery } from 'react-query'

const fetchUsers = async () => {
  const response = await fetch('/api/users')

  return response.json()
}

export default function Home() {
  const { data } = useQuery('users', fetchUsers)
  return (
    <div>
      <Head>
        <title>Coffee Recipes</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>Hello there</main>
      {JSON.stringify(data)}
    </div>
  )
}
