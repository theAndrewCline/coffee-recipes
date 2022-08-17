import Head from 'next/head'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data: { email: string }) => {
    await signIn('email', data)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Coffee Recipes</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container h-full flex-1 flex flex-col mx-auto p-4">
        <h1 className="font-bold text-3xl">Coffee Recipes</h1>
        <div className="flex-1 flex items-center justify-center h-full">
          <form
            className="flex flex-row items-end justify-center p-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col mx-4">
              <label htmlFor="email">Email</label>
              <input
                {...register('email', { required: true })}
                className="border border-slate-600 rounded px-4 py-1 focus:outline-none focus:border-teal-600"
              ></input>
            </div>
            <button className="bg-teal-600 text-white rounded shadow px-4 py-2 hover:shadow-lg hover:bg-teal-700 ">
              Sign In
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
