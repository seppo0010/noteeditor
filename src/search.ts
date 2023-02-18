import samples from "./mermaidSamples";

export interface MermaidResult {
  type: "mermaid";
  text: string;
}
export type Result = MermaidResult;

const searchMermaid = (criteria: string): MermaidResult[] => {
  return samples
    .filter((s) => s.startsWith(criteria))
    .map((text) => ({
      type: "mermaid",
      text,
    }));
};

export async function search(criteria: string): Promise<Result[]> {
  if (criteria === "") {
    return [];
  }
  return searchMermaid(criteria);
}
