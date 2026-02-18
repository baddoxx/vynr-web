export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="max-w-3xl mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">
          Vynr
        </h1>

        <p className="mt-6 text-xl text-neutral-600">
          A quiet atlas for wine.
        </p>

        <p className="mt-8 text-neutral-500">
          Explore regions. Track bottles. Keep a tasting journal.
        </p>

        <div className="mt-12">
          <a
            href="#"
            className="inline-block rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition"
          >
            Coming soon on the App Store
          </a>
        </div>
      </section>
    </main>
  );
}