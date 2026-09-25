import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

/**
 * Every major statistical concept is explained at three levels, per the
 * project spec: Simple (stakeholder), Mathematical (formula), Applied
 * (how it was actually used in this project).
 */
export function ExplainLevels({
  simple,
  math,
  applied,
}: {
  simple: ReactNode;
  math: ReactNode;
  applied: ReactNode;
}) {
  return (
    <Tabs defaultValue="simple" className="w-full">
      <TabsList>
        <TabsTrigger value="simple">Simple</TabsTrigger>
        <TabsTrigger value="math">Mathematical</TabsTrigger>
        <TabsTrigger value="applied">Applied</TabsTrigger>
      </TabsList>
      <TabsContent value="simple" className="pt-3 text-sm leading-relaxed text-foreground/90">
        {simple}
      </TabsContent>
      <TabsContent value="math" className="pt-3 text-sm leading-relaxed">
        {math}
      </TabsContent>
      <TabsContent value="applied" className="pt-3 text-sm leading-relaxed text-foreground/90">
        {applied}
      </TabsContent>
    </Tabs>
  );
}
