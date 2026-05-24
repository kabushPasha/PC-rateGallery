import { makeAutoObservable, runInAction } from "mobx";
import { Project } from "./Project";
import type { MediaFolder } from "./MediaFolder";

export class Media {
  fileHandle: FileSystemFileHandle;
  parentFolder: MediaFolder;
  path: string = "";
  rating: number = 0; // observable rating

  constructor(fileHandle: FileSystemFileHandle, parentFolder: MediaFolder) {
    this.fileHandle = fileHandle;
    this.parentFolder = parentFolder;
    this.path = parentFolder.path + "/" + fileHandle.name;

    // make all properties observable
    makeAutoObservable(this);

    // initialize rating from database if available
    const project = Project.getInstance();
    const entry = project.database?.data.media[this.name];
    if (entry?.rating !== undefined) {
      this.rating = entry.rating;
    }
  }

  get name(): string {
    return this.fileHandle.name;
  }

  async getFile(): Promise<File> {
    return this.fileHandle.getFile();
  }

  setRating(value: number) {
    this.rating = value;
    const project = Project.getInstance();
    project.database?.setMedia(this, { rating: value });
  }

  async delete() {
    try {
      // remove file from filesystem
      await this.parentFolder.root_folder.removeEntry(this.name);
      // remove from in-memory folder list
      runInAction(() => {
        this.parentFolder.files = this.parentFolder.files.filter(f => f !== this);
      })
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  }
}
