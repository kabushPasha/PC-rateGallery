import { Media } from "./Media";
import { makeAutoObservable, runInAction } from "mobx";
import { Project } from "./Project";

export class MediaFolder {
    root_folder: FileSystemDirectoryHandle;
    folders: MediaFolder[] = [];
    files: Media[] = []; // now stores Media objects
    loaded: boolean = false;
    path: string = ""; // new property
    bookmark: number | null = null;

    constructor(root_folder: FileSystemDirectoryHandle, path: string = "") {
        this.root_folder = root_folder;
        this.path = path + "/" + root_folder.name;

        makeAutoObservable(this, { root_folder: false, });
    }

    async readContents(): Promise<void> {
        if (this.loaded) return;

        const folders: MediaFolder[] = [];
        const files: Media[] = [];

        for await (const handle of (this.root_folder as any).values()) {
            if (handle.kind === "directory") {
                folders.push(new MediaFolder(handle, this.path));
            } else if (handle.kind === "file") {
                files.push(new Media(handle, this.path));
            }
        }
        
        runInAction(() => {
            this.folders = folders;
            this.files = files;
            this.loaded = true;

            // Read Bookmark
            const project = Project.getInstance();
            const dbBookmark = project.database?.getFolderBookmark(this.path);
            if (dbBookmark !== null && dbBookmark !== undefined) {
                this.bookmark = dbBookmark;
            }
        });
    }

    get name(): string {
        return this.root_folder.name;
    }

    setBookmark(page: number | null) {
        this.bookmark = page;

        const project = Project.getInstance();
        project.database?.setFolderBookmark(this.path, page);
        project.database?.save();
    }

    clearBookmark() {
        this.setBookmark(null);
    }
}
