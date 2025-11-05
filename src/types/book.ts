export interface Author {
  id: number;
  name: string;
  sort: string;
  link?: string;
}

export interface Series {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Identifier {
  book_id: number;
  kind: string;
  val: string;
}

export interface Book {
  id: number;
  title: string;
  pubdate: string;
  isbn: string;
  authors: Author[];
  publishers: string[];
  tags: Tag[];
  series: Series | null;
  rating: number | null;
  formats: string[];
  languages: string[];
}
