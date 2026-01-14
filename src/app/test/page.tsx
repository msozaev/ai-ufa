export default function TestEmbedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">

        </header>

        <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <div className="aspect-video">
            <iframe
              src="https://embed.liveavatar.com/v1/cdc01dd4-3b9e-45e8-870c-3df61927f92c"
              allow="microphone"
              title="LiveAvatar Embed"
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="text-sm text-slate-400">

        </div>
      </div>
    </main>
  )
}
