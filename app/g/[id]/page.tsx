import Link from "next/link";
import { notFound } from "next/navigation";
import { getGeneration } from "@/lib/storage";
import { PlatformTabs } from "@/components/PlatformTabs";

export const dynamic = "force-dynamic";

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const generation = await getGeneration(id);
  if (!generation) notFound();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
      <Link href="/" className="flex items-center gap-2 w-fit group">
        <span className="text-orange text-lg leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brj-logo.png" alt="Building Review Journal" className="h-7 w-auto" />
      </Link>

      <header className="flex flex-col md:flex-row gap-5 items-start">
        {generation.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={generation.heroImage}
            alt={generation.heroImageAlt ?? ""}
            className="w-full md:w-48 h-auto rounded-md border border-navy/10 object-cover"
          />
        ) : null}
        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-2xl font-semibold text-navy">{generation.title}</h1>
          {generation.author ? (
            <p className="text-sm text-navy/60">By {generation.author}</p>
          ) : null}
          <a
            href={generation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-navy/50 hover:text-orange truncate"
          >
            {generation.url}
          </a>
          {generation.excerpt ? (
            <p className="text-sm text-navy/70 mt-2 line-clamp-4">{generation.excerpt}</p>
          ) : null}
        </div>
      </header>

      <PlatformTabs generation={generation} />
    </main>
  );
}
