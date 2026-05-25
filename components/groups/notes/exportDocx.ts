/**
 * Converts a Tiptap JSON document to a downloadable .docx file.
 * Uses the `docx` npm package (v9+).
 */
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

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

export async function exportToDocx(doc: TiptapNode, filename: string): Promise<void> {
  const children = convertNode(doc);

  const document = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function convertNode(node: TiptapNode): Paragraph[] {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).flatMap((n) => convertNode(n));

    case "paragraph":
      return [new Paragraph({ children: convertInline(node.content ?? []) })];

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
      };
      return [
        new Paragraph({
          heading: headingMap[level] ?? HeadingLevel.HEADING_1,
          children: convertInline(node.content ?? []),
        }),
      ];
    }

    case "bulletList":
      return (node.content ?? []).flatMap((item) => convertListItem(item, "•"));

    case "orderedList":
      return (node.content ?? []).flatMap((item, i) => convertListItem(item, `${i + 1}.`));

    case "taskList":
      return (node.content ?? []).flatMap((item) => {
        const checked = (item.attrs?.checked as boolean) ? "☑" : "☐";
        return convertListItem(item, checked);
      });

    case "codeBlock": {
      const code = (node.content ?? []).map((n) => n.text ?? "").join("");
      const lines = code.split("\n");
      return lines.map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: "Courier New",
                size: 18, // 9pt
              }),
            ],
            // light grey background via indentation as visual hint
            indent: { left: 360 },
          })
      );
    }

    case "blockquote":
      return (node.content ?? []).flatMap((n) =>
        convertNode(n).map(
          (p) =>
            new Paragraph({
              children: (p as Paragraph & { options?: { children?: TextRun[] } }).options?.children ?? [
                new TextRun({ text: "" }),
              ],
              indent: { left: 720 },
            })
        )
      );

    case "horizontalRule":
      return [
        new Paragraph({
          children: [new TextRun({ text: "─────────────────────────────────" })],
        }),
      ];

    default:
      if (node.content) return (node.content ?? []).flatMap((n) => convertNode(n));
      if (node.text) return [new Paragraph({ children: [new TextRun({ text: node.text })] })];
      return [];
  }
}

function convertListItem(item: TiptapNode, prefix: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const content = item.content ?? [];

  for (let i = 0; i < content.length; i++) {
    const child = content[i];
    if (child.type === "paragraph") {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: prefix + "  " }), ...convertInline(child.content ?? [])],
          indent: { left: 360 },
        })
      );
    } else {
      // Nested list — recurse
      paragraphs.push(...convertNode(child).map(
        (p) =>
          new Paragraph({
            children: (p as unknown as { root?: { children?: TextRun[] } }).root?.children ?? [
              new TextRun({ text: "" }),
            ],
            indent: { left: 720 },
          })
      ));
    }
  }

  return paragraphs.length > 0
    ? paragraphs
    : [new Paragraph({ children: [new TextRun({ text: prefix + "  " })], indent: { left: 360 } })];
}

function convertInline(nodes: TiptapNode[]): TextRun[] {
  if (!nodes.length) return [new TextRun({ text: "" })];

  return nodes.map((node) => {
    if (node.type === "hardBreak") {
      return new TextRun({ text: "", break: 1 });
    }
    if (node.type !== "text") {
      return new TextRun({ text: "" });
    }

    const marks = node.marks ?? [];
    const opts: {
      text: string;
      bold?: boolean;
      italics?: boolean;
      underline?: object;
      strike?: boolean;
      font?: string;
      size?: number;
    } = { text: node.text ?? "" };

    for (const mark of marks) {
      switch (mark.type) {
        case "bold":
          opts.bold = true;
          break;
        case "italic":
          opts.italics = true;
          break;
        case "underline":
          opts.underline = {};
          break;
        case "strike":
          opts.strike = true;
          break;
        case "code":
          opts.font = "Courier New";
          opts.size = 18;
          break;
        // link: text stays as-is; URL not representable cleanly in plain TextRun
      }
    }

    return new TextRun(opts);
  });
}
