import { MediaFolder } from "./MediaFolder";
import { Media } from "./Media";
import { makeAutoObservable } from "mobx";

export interface MediaEntry {
  rating?: number;
  tag?: string;
  model?: string;
}

export interface RatingDatabase {
  media: Record<string, MediaEntry>; // media_name -> MediaEntry
  tags: string[];
  models: string[];
  bookmarks?: Record<string, number | null>; // path -> page
  folders: Record<string, FolderEntry>;
}

export interface FolderEntry {
  lastRating?: number;
  lastPageByRating: Record<number, number>;
  sortedByRating: Record<number, boolean>;
  done: boolean;
}

export class Database {
  folder: MediaFolder;
  data: RatingDatabase = { media: {}, tags: [], models: [], folders: {} };
  private loaded: boolean = false;
  private dbFileHandle: Media | null = null; // store the db file as Media

  constructor(folder: MediaFolder) {
    this.folder = folder;

    makeAutoObservable(this, {});
  }

  /** Load rating_database.json if it exists */
  async load() {
    if (this.loaded) return; // load only once
    if (!this.folder.loaded) await this.folder.readContents();

    // Find the database file in the folder
    let ratingFile = this.folder.files.find(f => f.name === "rating_database.json");

    if (ratingFile) {
      this.dbFileHandle = ratingFile; // store handle
      try {
        const fileData = await ratingFile.getFile();
        const text = await fileData.text();
        const json = JSON.parse(text) as RatingDatabase;
        this.data = { ...{ media: {}, tags: [], models: [], bookmarks: {}, folders: {} }, ...json };
      } catch (err) {
        console.error("Failed to read or parse rating_database.json:", err);
      }
    } else {
      // initialize empty structure
      this.data = { media: {}, tags: [], models: [], bookmarks: {}, folders: {} };

      // Create a new Media wrapper for the db file, but don’t create it on disk yet
      this.dbFileHandle = null;
    }

    this.loaded = true;
  }

  /** Get a media entry, creates it if not exist */
  getMediaEntry(media: Media) {
    const name = media.name;
    if (!this.data.media[name]) {
      this.data.media[name] = {};
    }
    return this.data.media[name];
  }

  /** Set rating, tag, or model for a media */
  setMedia(media: Media, entry: Partial<MediaEntry>) {
    const mediaEntry = this.getMediaEntry(media);
    Object.assign(mediaEntry, entry);
  }

  /** Add global tag */
  addTag(tag: string) {
    if (!this.data.tags.includes(tag)) this.data.tags.push(tag);
  }

  /** Add global model */
  addModel(model: string) {
    if (!this.data.models.includes(model)) this.data.models.push(model);
  }

  /** Save database back to rating_database.json */
  async save() {
    if (!this.folder.loaded) await this.folder.readContents();

    try {
      // If we don’t have a file handle yet, create it
      if (!this.dbFileHandle) {
        const handle = await (this.folder.root_folder as any).getFileHandle("rating_database.json", { create: true });
        this.dbFileHandle = new Media(handle); // wrap it in Media
        this.folder.files.push(this.dbFileHandle); // add to folder
      }

      const writable = await (this.dbFileHandle.fileHandle as any).createWritable();
      await writable.write(JSON.stringify(this.data, null, 2));
      await writable.close();
    } catch (err) {
      console.error("Failed to save rating_database.json:", err);
    }
  }

  setFolderBookmark(path: string, page: number | null) {
    if (!this.data.bookmarks) {
      this.data.bookmarks = {};
    }
    this.data.bookmarks[path] = page;
  }

  getFolderBookmark(path: string): number | null {
    return this.data.bookmarks?.[path] ?? null;
  }

  // Fodlers Helpers
  private createDefaultFolderEntry(): FolderEntry {
    const lastPageByRating: Record<number, number> = {};
    const sortedByRating: Record<number, boolean> = {};

    for (let i = 0; i <= 5; i++) {
      lastPageByRating[i] = 1;
      sortedByRating[i] = false;
    }

    return {
      lastRating: 0,
      lastPageByRating,
      sortedByRating,
      done: false,
    };
  }

  getFolderEntry(path: string): FolderEntry {
    if (!this.data.folders[path]) {
      this.data.folders[path] = this.createDefaultFolderEntry();
    }
    return this.data.folders[path];
  }

  setFolderRating(path: string, rating: number) {
    const folder = this.getFolderEntry(path);
    folder.lastRating = rating;
  }

  setFolderPage(path: string, rating: number, page: number) {
    const folder = this.getFolderEntry(path);
    folder.lastPageByRating[rating] = page;
  }

  setFolderSorted(path: string, rating: number, sorted: boolean) {
    const folder = this.getFolderEntry(path);
    folder.sortedByRating[rating] = sorted;
  }

  setFolderDone(path: string, done: boolean) {
    const folder = this.getFolderEntry(path);
    folder.done = done;
  }
}
