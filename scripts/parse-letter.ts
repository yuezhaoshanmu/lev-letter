import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import mammoth from "mammoth";

type LetterRun = { text: string; bold?: boolean };
type LetterParagraph = { id: number; sourceIndex: number; type: "paragraph" | "heading" | "rule" | "blank"; runs: LetterRun[]; text: string };

const root = process.cwd();
const output = path.join(root, "data", "letter.json");
const xmlUnescape = (value: string) => value
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, "&");

const withoutTags = (value: string) => value.replace(/<[^>]+>/g, "");

function readRun(xml: string): LetterRun | null {
  const textParts = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => xmlUnescape(match[1]));
  const lineBreaks = (xml.match(/<w:br(?:\s[^>]*)?\s*\/>/g) ?? []).length;
  const tabs = (xml.match(/<w:tab(?:\s[^>]*)?\s*\/>/g) ?? []).length;
  const text = textParts.join("") + "\n".repeat(lineBreaks) + "\t".repeat(tabs);
  if (!text) return null;
  const bold = /<w:b(?:\s[^>]*)?\s*\/>|<w:b(?:\s[^>]*)?\s+w:val=\"(?:true|1)\"[^>]*\/>/.test(xml);
  return { text, ...(bold ? { bold: true } : {}) };
}

function parseParagraph(sourceIndex: number, xml: string): LetterParagraph {
  const style = /<w:pStyle[^>]*w:val=\"([^\"]+)\"/.exec(xml)?.[1]?.toLowerCase() ?? "";
  const hasRule = /<w:pBdr[\s\S]*?<w:bottom/.test(xml);
  const runs = [...xml.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)]
    .map((match) => readRun(match[1]))
    .filter((run): run is LetterRun => Boolean(run));
  const text = runs.map((run) => run.text).join("");
  const type = hasRule ? "rule" : style.includes("heading") || style === "title" ? "heading" : text.trim() ? "paragraph" : "blank";
  return { id: sourceIndex, sourceIndex, type, runs, text };
}

async function findSource(): Promise<string> {
  const files = (await fs.readdir(root)).filter((file) => /\.docx$/i.test(file));
  if (!files.length) throw new Error("No .docx letter found in the project root.");
  const scored = await Promise.all(files.map(async (file) => {
    const buffer = await fs.readFile(path.join(root, file));
    const raw = (await mammoth.extractRawText({ buffer })).value;
    const score = ["饶饶", "致饶饶", "我喜欢你"].reduce((total, word) => total + (raw.match(new RegExp(word, "g"))?.length ?? 0), 0);
    return { file, score };
  }));
  return path.join(root, scored.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file, "zh-CN"))[0].file);
}

async function main() {
  const source = await findSource();
  const buffer = await fs.readFile(source);
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("The document does not contain word/document.xml.");
  const xml = await documentFile.async("string");
  const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)]
    .map((match, index) => parseParagraph(index, match[1]));
  if (!paragraphs.some((paragraph) => paragraph.text.trim())) throw new Error("No readable text was found in the selected document.");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify({ source: path.basename(source), generatedAt: new Date().toISOString(), paragraphs }, null, 2) + "\n", "utf8");
  console.log(`Parsed ${paragraphs.filter((paragraph) => paragraph.text.trim()).length} non-empty paragraphs from ${path.basename(source)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
