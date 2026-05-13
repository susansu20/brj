"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PlatformTab } from "@/components/PlatformTab";
import {
  PLATFORMS,
  PLATFORM_LABEL,
  type Generation,
  type Platform,
  type PlatformOutput,
} from "@/lib/brand";

type LoadingMap = Partial<Record<Platform, boolean>>;
type OutputMap = Partial<Record<Platform, PlatformOutput>>;
type ErrorMap = Partial<Record<Platform, string>>;
type VersionMap = Partial<Record<Platform, number>>;

export function PlatformTabs({ generation }: { generation: Generation }) {
  const [active, setActive] = useState<Platform>("instagram");
  const [outputs, setOutputs] = useState<OutputMap>(generation.platforms);
  const [loading, setLoading] = useState<LoadingMap>({});
  const [errors, setErrors] = useState<ErrorMap>({});
  const [versions, setVersions] = useState<VersionMap>({});
  const inFlight = useRef<Set<Platform>>(new Set());

  const generate = useCallback(
    async (platform: Platform) => {
      if (inFlight.current.has(platform)) return;
      inFlight.current.add(platform);
      setLoading((s) => ({ ...s, [platform]: true }));
      setErrors((s) => ({ ...s, [platform]: undefined }));
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: generation.id, platform }),
        });
        const text = await res.text();
        let data: { platform?: PlatformOutput; error?: string } = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          const snippet = text.replace(/\s+/g, " ").slice(0, 200);
          throw new Error(
            `Generation failed (HTTP ${res.status}): ${snippet || "empty response"}`,
          );
        }
        if (!res.ok) throw new Error(data.error ?? `Generation failed (HTTP ${res.status})`);
        if (!data.platform) throw new Error("Generation returned no platform payload");
        setOutputs((s) => ({ ...s, [platform]: data.platform }));
        setVersions((s) => ({ ...s, [platform]: Date.now() }));
      } catch (err) {
        setErrors((s) => ({
          ...s,
          [platform]: err instanceof Error ? err.message : String(err),
        }));
      } finally {
        inFlight.current.delete(platform);
        setLoading((s) => ({ ...s, [platform]: false }));
      }
    },
    [generation.id],
  );

  // Auto-fire generation for any missing platforms on first visit (per tab session).
  useEffect(() => {
    const key = `brj:auto:${generation.id}`;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    for (const p of PLATFORMS) {
      if (!outputs[p]) {
        void generate(p);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation.id]);

  return (
    <Tabs
      value={active}
      onValueChange={(v) => setActive(v as Platform)}
      className="flex flex-col gap-4"
    >
      <TabsList>
        {PLATFORMS.map((p) => (
          <TabsTrigger key={p} value={p}>
            <span className="inline-flex items-center gap-1.5">
              {PLATFORM_LABEL[p]}
              {loading[p] ? (
                <Spinner className="h-3 w-3 text-orange" />
              ) : outputs[p] ? (
                <span className="text-orange leading-none">●</span>
              ) : null}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {PLATFORMS.map((p) => (
        <TabsContent key={p} value={p}>
          <PlatformTab
            id={generation.id}
            platform={p}
            output={outputs[p]}
            loading={!!loading[p]}
            error={errors[p]}
            version={versions[p] ?? 0}
            onRegenerate={() => generate(p)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
