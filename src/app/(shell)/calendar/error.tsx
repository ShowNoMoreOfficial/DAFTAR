'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <p className="text-red-400">Something went wrong loading this page.</p>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-500">Try again</button>
    </div>
  )
}
