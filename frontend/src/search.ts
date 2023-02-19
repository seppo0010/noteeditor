import MiniSearch from "minisearch";
import samples from "./mermaidSamples";
import infoleg_ from "./infoleg.json";

const infoleg: {
  [criteria: string]: {
    title: string;
    text: string;
  };
} = infoleg_;

export interface MermaidResult {
  type: "mermaid";
  text: string;
}
export interface SearchResult {
  type: "search";
  text: string;
  path: string;
}
export interface InfolegResult {
  type: "infoleg";
  title: string;
  text: string;
}
export type Result = MermaidResult | SearchResult | InfolegResult;

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
const searchInfoleg = (criteria: string): InfolegResult[] => {
  return infoleg.hasOwnProperty(criteria)
    ? [
        {
          type: "infoleg",
          ...infoleg[criteria],
        },
      ]
    : [];
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
  return [
    ...searchInfoleg(criteria),
    ...searchMermaid(criteria),
    ...searchDocuments(criteria, miniSearch),
  ];
}
