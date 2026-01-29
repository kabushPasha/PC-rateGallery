import { MediaFolder } from "./MediaFolder";
import { Media } from "./Media";

export interface MediaEntry {
  rating?: number;
  tag?: string;
  model?: string;
}

export interface RatingDatabase {
  media: Record<string, MediaEntry>; // media_name -> MediaEntry
  tags: string[];
  models: string[];
}

export class Database {
  folder: MediaFolder;
  data: RatingDatabase = { media: {}, tags: [], models: [] };
  private loaded: boolean = false;
  private dbFileHandle: Media | null = null; // store the db file as Media

  constructor(folder: MediaFolder) {
    this.folder = folder;
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
        this.data = json;
      } catch (err) {
        console.error("Failed to read or parse rating_database.json:", err);
      }
    } else {
      // initialize empty structure
      this.data = { media: {}, tags: [], models: [] };

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
}
