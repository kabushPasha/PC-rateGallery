import { makeAutoObservable, runInAction, toJS } from "mobx";
import { MediaFolder } from "./MediaFolder";
import { Database } from "./Database";

export class Project {
    root: MediaFolder | null = null;
    selectedFolder: MediaFolder | null = null; // tracks the currently selected folder
    database: Database | null = null; // new database instance

    private static _instance: Project; // singleton instance

    private constructor(rootFolder?: FileSystemDirectoryHandle) {
        makeAutoObservable(this); // makes all properties observable

        if (rootFolder) {
            this.setRootFolder(rootFolder);
        }
    }

    /** Singleton getter */
    static getInstance(rootFolder?: FileSystemDirectoryHandle) {
        if (!Project._instance) {
            Project._instance = new Project(rootFolder);
        }
        return Project._instance;
    }

    /** Set the root folder */
    async setRootFolder(folder: FileSystemDirectoryHandle) {
        const mediaFolder = new MediaFolder(folder);

        // Create and load database
        const db = new Database(mediaFolder);
        await db.load();

        await mediaFolder.readContents();

        runInAction(() => {
            this.root = mediaFolder;
            this.selectedFolder = null; // reset selection when root changes
            this.database = db; // assign loaded database
        });
    }

    /** Set the selected folder */
    setSelectedFolder(folder: MediaFolder | null) {
        runInAction(() => {
            this.selectedFolder = folder;
        });
    }

    log() {
        console.log(toJS(this));
    }
}
