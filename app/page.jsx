import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <section className="text-center px-6">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900">
          Personnel Stress & Welfare Management System
        </h1>

        <div className="mt-10">
          <Link
            href="/sign-in"
            className="inline-flex rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}