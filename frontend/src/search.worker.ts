import MiniSearch, { Options } from "minisearch";
import samples from "./mermaidSamples";
import infoleg_ from "./infoleg.json";

const infoleg: {
  [criteria: string]: {
    title: string;
    text: string;
  };
} = infoleg_;

const miniSearchOptions: Options = {
  idField: "path",
  fields: ["text"],
  storeFields: ["path", "text"],
};
let miniSearch: MiniSearch | null = null;
const miniSearchInfoleg = new MiniSearch({
  idField: "key",
  fields: ["text"],
  storeFields: ["title", "text"],
});
miniSearchInfoleg.addAll(
  Object.entries(infoleg).map(([key, { title, text }]) => ({
    key,
    title,
    text,
  }))
);

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
    : miniSearchInfoleg.search(criteria).slice(0, 10).map((res) => ({
        type: "infoleg",
        text: res.text,
        title: res.title,
      }));
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const searchDocuments = (criteria: string): SearchResult[] => {
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

export async function search(criteria: string): Promise<Result[]> {
  if (criteria === "") {
    return [];
  }
  return [
    ...searchInfoleg(criteria),
    ...searchMermaid(criteria),
    ...searchDocuments(criteria),
  ];
}

export async function setMiniSearchData(data: string | null): Promise<void> {
  if (data === null) {
    miniSearch = null;
  } else {
    miniSearch = MiniSearch.loadJSON(data, miniSearchOptions);
  }
}

export async function addMiniSearchData(data: any[]): Promise<string | null> {
  miniSearch?.addAll(data);
  return JSON.stringify(miniSearch?.toJSON());
}
