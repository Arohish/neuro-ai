import {
  createRouter,
  RouterProvider,
  useRouter,
} from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

function DefaultErrorComponent({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2.25m0 3.75h.008v.008H12v-.008zm0-12a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">
          Something went wrong
        </h1>

        <p className="mb-6 text-gray-400">
          {error.message || 'Unexpected application error'}
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              reset()
              router.invalidate()
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>

          <a
            href="/"
            className="rounded-lg border border-gray-600 px-4 py-2 text-white hover:bg-gray-800"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

export const router = createRouter({
  routeTree,
  context: {},
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultErrorComponent,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}