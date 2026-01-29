import { Media } from "./Media";

export class MediaFolder {
    root_folder: FileSystemDirectoryHandle;
    folders: MediaFolder[] = [];
    files: Media[] = []; // now stores Media objects
    loaded: boolean = false;
    path: string = ""; // new property

    constructor(root_folder: FileSystemDirectoryHandle, path: string = "") {
        this.root_folder = root_folder;
        this.path = path + "/" + root_folder.name; 
    }

    async readContents(): Promise<void> {
        if (this.loaded) return; // skip if already loaded

        this.folders = [];
        this.files = [];

        // cast to any to bypass TS typing
        for await (const handle of (this.root_folder as any).values()) {
            if (handle.kind === "directory") {
                const childFolder = new MediaFolder(handle,this.path);
                this.folders.push(childFolder);
            } else if (handle.kind === "file") {
                this.files.push(new Media(handle,this.path)); // wrap handle in Media
            }
        }

        this.loaded = true; // mark as loaded
    }

    get name(): string {
        return this.root_folder.name;
    }
}
