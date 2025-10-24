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
  sort: string;
  timestamp: string;
  pubdate: string;
  series_index: number;
  author_sort: string;
  isbn: string;
  lccn: string;
  path: string;
  has_cover: boolean;
  authors: Author[];
  publishers: string[];
  tags: Tag[];
  series: Series | null;
  comments: string | null;
  rating: number | null;
  formats: string[];
  identifiers: Identifier[];
  languages: string[];
}
