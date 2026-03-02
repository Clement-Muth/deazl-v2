export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Deazl</h1>
          <p className="mt-1 text-sm text-gray-500">
            Planifiez vos repas, maîtrisez vos courses
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}
