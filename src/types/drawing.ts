export interface DrawingData {
  path: string;
  content: string;
  lastModified: number;
}

export interface DrawingMeta {
  lastModified: number;
  size: number;
}

export interface LibraryInfo {
  name: string;
  path: string;
}
