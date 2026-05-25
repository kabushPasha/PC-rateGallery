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

        console.log("Loading:", this.path);
        const folders: MediaFolder[] = [];
        const files: Media[] = [];

        for await (const handle of (this.root_folder as any).values()) {
            if (handle.kind === "directory") {
                const subFolder = new MediaFolder(handle, this.path);
                //await subFolder.readContents();
                folders.push(subFolder);
            } else if (handle.kind === "file") {
                files.push(new Media(handle,this));
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

    async readContentsRecursive(): Promise<void> {
        await this.readContents();
        await Promise.all(this.folders.map(f => f.readContentsRecursive()));
    }

    get name(): string {
        return this.root_folder.name;
    }

    get files_recursive(): Media[] {
        return [
            ...this.files,
            ...this.folders.flatMap(folder => folder.files_recursive),
        ];
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

    get ratingStats(): { total: number; ratings: number[] } {
        const ratings = [0,0,0, 0, 0, 0, 0];
        let total = 0;

        // count current folder
        for (const file of this.files) {
            total++;

            if (file.rating >= -1 && file.rating <= 5) {
                ratings[file.rating+1 ]++;
            }
        }

        // include subfolders (recursive)s
        for (const folder of this.folders) {
            const sub = folder.ratingStats;

            total += sub.total;
            for (let i = 0; i < 5; i++) {
                ratings[i] += sub.ratings[i];
            }
        }

        return { total, ratings };
    }

    get ratingSummary(): string {
        const { total, ratings } = this.ratingStats;
        return `${total} [ ${ratings.join(" | ")} ]`;
    }
}
