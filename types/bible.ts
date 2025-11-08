// types/bible.ts
export interface Verse {
  verseNum: string;
  text: string;
}

export interface Book {
  name: string;
  chapters: {
    [chapterNum: string]: Verse[];
  };
}

export interface BibleData {
  [bookCode: string]: Book;
}