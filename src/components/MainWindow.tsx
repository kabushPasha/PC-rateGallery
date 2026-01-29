import { Group, Panel, Separator } from "react-resizable-panels";
import FolderViewPanel from "./FolderViewPanel";
import { PreviewGallery } from "./PreviewGallery";



export default function MainWindow() {
  return (
    <div className="d-flex vh-100 w-100 bg-dark text-white">
      <Group orientation="horizontal" style={{ height: "100%" }}>

        {/* Left panel — FolderViewPanel */}
        <Panel collapsible collapsedSize={35} minSize={100} defaultSize={200}>
          <FolderViewPanel />
        </Panel>

        {/* Separator */}
        <Separator
          style={{
            width: "8px",
            cursor: "ew-resize",
            backgroundColor: "#444",
            transition: "background-color 0.2s",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#666")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#444")}
        />

        {/* Right panel */}
        <Panel minSize={200}>
          <PreviewGallery />
        </Panel>

      </Group>
    </div>
  );
}
