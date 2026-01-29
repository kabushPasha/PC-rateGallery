import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { Button } from "react-bootstrap";
import { MediaFolderTreeItem } from "./MediaFodlerTreeItem";
import { FaFolderOpen, FaClipboardList, FaSave } from 'react-icons/fa';

const FolderViewPanel: React.FC = observer(() => {
    // Get the global singleton instance
    const project = Project.getInstance();

    const openFolder = async () => {
        try {
            const handle = await (window as any).showDirectoryPicker();
            await project.setRootFolder(handle);
        } catch (err) {
            console.error("Folder selection cancelled or failed", err);
        }
    };

    const saveRatings = async () => {
        if (project.database) {
            await project.database.save();
            console.log("Ratings saved!");
        } else {
            console.warn("No database loaded to save.");
        }
    };

    return (
        <div className="d-flex flex-column h-100 w-100 p-3 bg-secondary text-white">
            <div className="mb-3 d-flex gap-2">
                <div className="mb-3 d-flex gap-2">
                    <Button variant="light" onClick={openFolder}>
                        <FaFolderOpen />
                    </Button>
                    <Button variant="info" onClick={() => project.log()} disabled={!project.root}>
                        <FaClipboardList />
                    </Button>
                    <Button variant="success" onClick={saveRatings} disabled={!project.database}>
                        <FaSave />
                    </Button>
                </div>
            </div>

            {project.root?.root_folder?.name && (
                <div className="mb-2">
                    <strong>Root folder:</strong> {project.root.root_folder.name}
                </div>
            )}

            <div className="flex-grow-1 overflow-auto">
                <MediaFolderTreeItem folder={project.root} />
            </div>
        </div>
    );
});

export default FolderViewPanel;
