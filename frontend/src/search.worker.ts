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
  starts: number;
  ends: number;
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
    : miniSearchInfoleg
        .search(criteria)
        .slice(0, 10)
        .map((res) => ({
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
  const previewText = (text: string, index: number, path: string) => {
    const maybeStarts = text.substring(0, index).lastIndexOf("\n");
    const starts = maybeStarts === -1 ? 0 : maybeStarts;
    const maybeEnds = text.substring(index).indexOf("\n");
    const ends = maybeEnds === -1 ? text.length : index + maybeEnds;
    return {
      type: "search",
      text,
      starts,
      ends,
      path,
    };
  };
  return miniSearch
    .search(criteria)
    .flatMap((res) => {
      const { text } = (res as unknown) as { text: string };
      return Array.from(text.matchAll(new RegExp(escapeRegExp(criteria), "ig")))
        .map((e) => e.index ?? 0)
        .map((i: number) => previewText(text, i, res.path));
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
  ].slice(0, 10);
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
