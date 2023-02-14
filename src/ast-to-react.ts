import type { ReactNode } from "react";
import type { Position } from "unist";
import type { Element, Root, Text, Comment, DocType } from "hast";
import type { Schema } from "property-information";

import React from "react";
import ReactIs from "react-is";
import { whitespace } from "hast-util-whitespace";
import { svg, find, hastToReact } from "property-information";
import { stringify as spaces } from "space-separated-tokens";
import { stringify as commas } from "comma-separated-tokens";
import style from "style-to-object";
import { uriTransformer } from "./uri-transformer";
import { Options } from "vfile";

interface Raw {
  type: "raw";
  value: string;
}
interface Context {
  options: Options;
  schema: Schema;
  listDepth: number;
}

const own = {}.hasOwnProperty;

const tableElements = new Set(["table", "thead", "tbody", "tfoot", "tr"]);

export function childrenToReact(
  context: Context,
  node: Element | Root
): Array<ReactNode> {
  const children = [];
  let childIndex = -1;
  let child: Comment | DocType | Element | Raw | Text;

  while (++childIndex < node.children.length) {
    child = node.children[childIndex];

    if (child.type === "element") {
      children.push(toReact(context, child, childIndex, node));
    } else if (child.type === "text") {
      if (
        node.type !== "element" ||
        !tableElements.has(node.tagName) ||
        !whitespace(child)
      ) {
        children.push(child.value);
      }
    } else if (child.type === "raw" && !context.options.skipHtml) {
      // Default behavior is to show (encoded) HTML.
      children.push(child.value);
    }
  }

  return children;
}

function toReact(
  context: Context,
  node: Element,
  index: number,
  parent: Element | Root
) {
  const options = context.options;
  const transform = uriTransformer;
  const parentSchema = context.schema;
  const name = node.tagName;
  const properties: Record<string, unknown> = {};
  let schema = parentSchema;
  let property: string;

  if (parentSchema.space === "html" && name === "svg") {
    schema = svg;
    context.schema = schema;
  }

  if (node.properties) {
    for (property in node.properties) {
      if (own.call(node.properties, property)) {
        addProperty(properties, property, node.properties[property], context);
      }
    }
  }

  if (name === "ol" || name === "ul") {
    context.listDepth++;
  }

  const children = childrenToReact(context, node);

  if (name === "ol" || name === "ul") {
    context.listDepth--;
  }

  // Restore parent schema.
  context.schema = parentSchema;

  // Nodes created by plugins do not have positional info, in which case we use
  // an object that matches the position interface.
  const position = node.position || {
    start: { line: null, column: null, offset: null },
    end: { line: null, column: null, offset: null },
  };
  const component = name;
  const basic = typeof component === "string" || component === React.Fragment;

  if (!ReactIs.isValidElementType(component)) {
    throw new TypeError(
      `Component for name \`${name}\` not defined or is not renderable`
    );
  }

  properties.key = [
    name,
    position.start.line,
    position.start.column,
    index,
  ].join("-");

  if (name === "a" && options.linkTarget) {
    properties.target =
      typeof options.linkTarget === "function"
        ? options.linkTarget(
            String(properties.href || ""),
            node.children,
            typeof properties.title === "string" ? properties.title : null
          )
        : options.linkTarget;
  }

  if (name === "a" && transform) {
    properties.href = transform(String(properties.href || ""));
  }

  if (
    !basic &&
    name === "code" &&
    parent.type === "element" &&
    parent.tagName !== "pre"
  ) {
    properties.inline = true;
  }

  if (
    !basic &&
    (name === "h1" ||
      name === "h2" ||
      name === "h3" ||
      name === "h4" ||
      name === "h5" ||
      name === "h6")
  ) {
    properties.level = Number.parseInt(name.charAt(1), 10);
  }

  if (!basic && name === "li" && parent.type === "element") {
    const input = getInputElement(node);
    properties.checked =
      input && input.properties ? Boolean(input.properties.checked) : null;
    properties.index = getElementsBeforeCount(parent, node);
    properties.ordered = parent.tagName === "ol";
  }

  if (!basic && (name === "ol" || name === "ul")) {
    properties.ordered = name === "ol";
    properties.depth = context.listDepth;
  }

  if (name === "td" || name === "th") {
    if (properties.align) {
      if (!properties.style) properties.style = {};
      // @ts-expect-error assume `style` is an object
      properties.style.textAlign = properties.align;
      delete properties.align;
    }

    if (!basic) {
      properties.isHeader = name === "th";
    }
  }

  if (!basic && name === "tr" && parent.type === "element") {
    properties.isHeader = Boolean(parent.tagName === "thead");
  }

  // If `sourcePos` is given, pass source information (line/column info from markdown source).
  if (options.sourcePos) {
    properties["data-sourcepos"] = flattenPosition(position);
  }

  if (!basic && options.rawSourcePos) {
    properties.sourcePosition = node.position;
  }

  // If `includeElementIndex` is given, pass node index info to components.
  if (!basic && options.includeElementIndex) {
    properties.index = getElementsBeforeCount(parent, node);
    properties.siblingCount = getElementsBeforeCount(parent);
  }

  if (!basic) {
    properties.node = node;
  }

  // Ensure no React warnings are emitted for void elements w/ children.
  return children.length > 0
    ? React.createElement(component, properties, children)
    : React.createElement(component, properties);
}

function getInputElement(node: Element | Root): Element | null {
  let index = -1;

  while (++index < node.children.length) {
    const child = node.children[index];

    if (child.type === "element" && child.tagName === "input") {
      return child;
    }
  }

  return null;
}

function getElementsBeforeCount(parent: Element | Root, node?: Element) {
  let index = -1;
  let count = 0;

  while (++index < parent.children.length) {
    if (parent.children[index] === node) break;
    if (parent.children[index].type === "element") count++;
  }

  return count;
}

function addProperty(
  props: Record<string, unknown>,
  prop: string,
  value: unknown,
  ctx: Context
): void {
  const info = find(ctx.schema, prop);
  let result = value;

  // Ignore nullish and `NaN` values.
  // eslint-disable-next-line no-self-compare
  if (result === null || result === undefined || result !== result) {
    return;
  }

  // Accept `array`.
  // Most props are space-separated.
  if (Array.isArray(result)) {
    result = info.commaSeparated ? commas(result) : spaces(result);
  }

  if (info.property === "style" && typeof result === "string") {
    result = parseStyle(result);
  }

  if (info.space && info.property) {
    props[
      own.call(hastToReact, info.property)
        ? hastToReact[info.property]
        : info.property
    ] = result;
  } else if (info.attribute) {
    props[info.attribute] = result;
  }
}

function parseStyle(value: string): Record<string, string> {
  const result: Record<string, string> = {};

  try {
    style(value, iterator);
  } catch {
    // Silent.
  }

  return result;

  function iterator(name: string, v: string) {
    const k = name.slice(0, 4) === "-ms-" ? `ms-${name.slice(4)}` : name;
    result[k.replace(/-([a-z])/g, styleReplacer)] = v;
  }
}

function styleReplacer(_: unknown, $1: string) {
  return $1.toUpperCase();
}

function flattenPosition(
  pos:
    | Position
    | {
        start: { line: null; column: null; offset: null };
        end: { line: null; column: null; offset: null };
      }
): string {
  return [
    pos.start.line,
    ":",
    pos.start.column,
    "-",
    pos.end.line,
    ":",
    pos.end.column,
  ]
    .map(String)
    .join("");
}
