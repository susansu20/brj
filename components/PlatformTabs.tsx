"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlatformTab } from "@/components/PlatformTab";
import { PLATFORMS, PLATFORM_LABEL, type Generation, type Platform } from "@/lib/brand";

export function PlatformTabs({ generation }: { generation: Generation }) {
  const [active, setActive] = useState<Platform>("instagram");
  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as Platform)} className="flex flex-col gap-4">
      <TabsList>
        {PLATFORMS.map((p) => (
          <TabsTrigger key={p} value={p}>
            {PLATFORM_LABEL[p]}
            {generation.platforms[p] ? <span className="ml-1.5 text-orange">●</span> : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {PLATFORMS.map((p) => (
        <TabsContent key={p} value={p}>
          <PlatformTab id={generation.id} platform={p} output={generation.platforms[p]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
