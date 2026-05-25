/** Converts a Tiptap JSON document to a GitHub-flavoured Markdown string. */

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export function editorJsonToMarkdown(doc: TiptapNode): string {
  return serializeDoc(doc).replace(/\n{3,}/g, "\n\n").trim();
}

function serializeDoc(doc: TiptapNode): string {
  return (doc.content ?? []).map((n) => serializeBlock(n)).join("\n\n");
}

function serializeBlock(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph": {
      const text = serializeInline(node.content ?? []);
      return text;
    }
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return "#".repeat(level) + " " + serializeInline(node.content ?? []);
    }
    case "bulletList":
      return (node.content ?? []).map((item) => serializeListItem(item, "- ", 0)).join("\n");
    case "orderedList":
      return (node.content ?? []).map((item, i) => serializeListItem(item, `${i + 1}. `, 0)).join("\n");
    case "taskList":
      return (node.content ?? [])
        .map((item) => {
          const checked = (item.attrs?.checked as boolean) ? "x" : " ";
          return serializeListItem(item, `- [${checked}] `, 0);
        })
        .join("\n");
    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      const code = (node.content ?? []).map((n) => n.text ?? "").join("");
      return "```" + lang + "\n" + code + "\n```";
    }
    case "blockquote":
      return (node.content ?? [])
        .map((n) => serializeBlock(n))
        .join("\n")
        .split("\n")
        .map((line) => "> " + line)
        .join("\n");
    case "horizontalRule":
      return "---";
    case "hardBreak":
      return "  \n";
    default:
      if (node.content) return (node.content ?? []).map((n) => serializeBlock(n)).join("\n");
      if (node.text) return node.text;
      return "";
  }
}

function serializeListItem(item: TiptapNode, prefix: string, depth: number): string {
  const indent = "  ".repeat(depth);
  const firstPara = item.content?.[0];
  let result = indent + prefix + serializeInline(firstPara?.content ?? []);

  // Nested lists
  for (let i = 1; i < (item.content ?? []).length; i++) {
    const child = item.content![i];
    const nested = serializeNestedList(child, depth + 1);
    if (nested) result += "\n" + nested;
  }
  return result;
}

function serializeNestedList(node: TiptapNode, depth: number): string {
  const indent = "  ".repeat(depth);
  switch (node.type) {
    case "bulletList":
      return (node.content ?? []).map((item) => serializeListItem(item, "- ", depth)).join("\n");
    case "orderedList":
      return (node.content ?? []).map((item, i) => serializeListItem(item, `${i + 1}. `, depth)).join("\n");
    case "taskList":
      return (node.content ?? [])
        .map((item) => {
          const checked = (item.attrs?.checked as boolean) ? "x" : " ";
          return serializeListItem(item, `- [${checked}] `, depth);
        })
        .join("\n");
    default:
      return indent + serializeBlock(node);
  }
}

function serializeInline(nodes: TiptapNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type !== "text") return "";
      return applyMarks(node.text ?? "", node.marks ?? []);
    })
    .join("");
}

function applyMarks(text: string, marks: TiptapMark[]): string {
  return marks.reduce((result, mark) => {
    switch (mark.type) {
      case "bold":
        return `**${result}**`;
      case "italic":
        return `_${result}_`;
      case "strike":
        return `~~${result}~~`;
      case "code":
        return `\`${result}\``;
      case "link": {
        const href = (mark.attrs?.href as string) ?? "";
        return `[${result}](${href})`;
      }
      case "underline":
        return result; // No standard markdown equivalent
      default:
        return result;
    }
  }, text);
}
