import Link from "next/link";
import { GenerateForm } from "@/components/GenerateForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listGenerations } from "@/lib/storage";
import { PLATFORMS, PLATFORM_LABEL } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function Home() {
  const generations = await listGenerations();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brj-logo.png"
          alt="Building Review Journal"
          width={171}
          height={40}
          className="h-10 w-auto self-start"
        />
        <h1 className="text-2xl font-semibold text-navy">Social Repurposing Portal</h1>
        <p className="text-sm text-navy/70">
          Paste an article URL. We&apos;ll scrape it and generate caption + 6 slide PNGs for Instagram, Facebook, and LinkedIn.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New article</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerateForm />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-navy/70 uppercase tracking-wider">Past generations</h2>
        {generations.length === 0 ? (
          <p className="text-sm text-navy/50">Nothing yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {generations.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/g/${g.id}`}
                  className="block rounded-md border border-navy/10 bg-white p-4 hover:border-orange hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-navy truncate">{g.title || g.url}</p>
                      <p className="text-xs text-navy/50 truncate">{g.url}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {PLATFORMS.map((p) => (
                        <span
                          key={p}
                          className={
                            "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded " +
                            (g.platforms[p]
                              ? "bg-orange text-white"
                              : "bg-navy/5 text-navy/40")
                          }
                          title={PLATFORM_LABEL[p]}
                        >
                          {p.slice(0, 2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
