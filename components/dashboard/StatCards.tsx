import { Stat } from "@/components/ui/Stat";
import { FolderKanban, Film, Download, Zap } from "lucide-react";

export function StatCards({ stats }: { stats: { projects: number; shorts: number; exports: number; credits: number } }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Projects" value={stats.projects} icon={FolderKanban} spark={[2, 3, 3, 4, 5, 6, 7, 8]} delta={12} deltaLabel="vs last month" />
      <Stat label="AI Shorts" value={stats.shorts} icon={Film} spark={[1, 2, 4, 3, 6, 5, 8, 10]} delta={24} deltaLabel="vs last month" />
      <Stat label="Exports" value={stats.exports} icon={Download} spark={[1, 1, 2, 3, 3, 5, 4, 6]} delta={8} deltaLabel="vs last month" />
      <Stat label="Credits left" value={stats.credits} icon={Zap} spark={[10, 9, 9, 8, 7, 7, 6, 6]} delta={-4} deltaLabel="this cycle" />
    </div>
  );
}
