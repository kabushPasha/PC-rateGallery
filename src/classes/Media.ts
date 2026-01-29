import { makeAutoObservable } from "mobx";
import { Project } from "./Project";

export class Media {
  fileHandle: FileSystemFileHandle;
  path: string = "";
  rating: number = 0; // observable rating

  constructor(fileHandle: FileSystemFileHandle, path: string = "") {
    this.fileHandle = fileHandle;
    this.path = path + "/" + fileHandle.name;

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
}
