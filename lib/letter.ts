export type LetterRun = { text: string; bold?: boolean };

export type LetterParagraph = {
  id: number;
  sourceIndex: number;
  type: "paragraph" | "heading" | "rule" | "blank";
  runs: LetterRun[];
  text: string;
};

export type LetterData = {
  source: string;
  generatedAt: string;
  paragraphs: LetterParagraph[];
};

export type Chapter = {
  at: number;
  number: string;
  title: string;
  mood: "forest" | "water" | "memory" | "quiet" | "dawn";
};

export const chapters: Chapter[] = [
  { at: 21, number: "I", title: "共时性", mood: "water" },
  { at: 66, number: "II", title: "那些旧日的输赢", mood: "forest" },
  { at: 214, number: "III", title: "金水相涵", mood: "water" },
  { at: 321, number: "IV", title: "夏天会结束", mood: "quiet" },
  { at: 426, number: "V", title: "具体的人", mood: "quiet" },
  { at: 464, number: "VI", title: "少年时代", mood: "memory" },
  { at: 587, number: "VII", title: "阶段性的友谊", mood: "forest" },
  { at: 641, number: "VIII", title: "那些没有说出口的话", mood: "quiet" },
  { at: 861, number: "IX", title: "靠近以前", mood: "forest" },
  { at: 1013, number: "X", title: "爱是一段路", mood: "water" },
  { at: 1050, number: "XI", title: "很久与永远", mood: "quiet" },
  { at: 1144, number: "XII", title: "喜欢与自由", mood: "dawn" },
  { at: 1204, number: "XIII", title: "像一棵树", mood: "forest" },
  { at: 1243, number: "XIV", title: "一本书", mood: "dawn" },
  { at: 1394, number: "XV", title: "走到你面前", mood: "dawn" },
];

export const highlightParagraphs = new Set([19, 229, 403, 729, 889, 1020, 1135, 1138, 1210, 1324, 1386, 1509]);
