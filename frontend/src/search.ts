import MiniSearch from "minisearch";
import samples from "./mermaidSamples";

export interface MermaidResult {
  type: "mermaid";
  text: string;
}
export interface SearchResult {
  type: "search";
  text: string;
  path: string;
}
export type Result = MermaidResult | SearchResult;

const searchMermaid = (criteria: string): MermaidResult[] => {
  const prefix = "mermaid:";
  if (!criteria.startsWith(prefix)) {
    return [];
  }
  return samples
    .filter((s) => s.startsWith(criteria.substring(prefix.length)))
    .map((text) => ({
      type: "mermaid",
      text,
    }));
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const searchDocuments = (
  criteria: string,
  miniSearch: MiniSearch | null
): SearchResult[] => {
  if (miniSearch === null) {
    return [];
  }
  return miniSearch
    .search(criteria)
    .flatMap((res) => {
      const { text } = (res as unknown) as { text: string };
      const indices = Array.from(
        text.matchAll(new RegExp(escapeRegExp(criteria), "ig"))
      ).map((e) => e.index ?? 0);
      return indices.map((i: number) => ({
        type: "search",
        text: text.substring(i, i + 100),
        path: res.path,
      }));
    })
    .slice(0, 10) as SearchResult[];
};

export async function search(
  criteria: string,
  miniSearch: MiniSearch | null
): Promise<Result[]> {
  if (criteria === "") {
    return [];
  }
  return [...searchMermaid(criteria), ...searchDocuments(criteria, miniSearch)];
}
