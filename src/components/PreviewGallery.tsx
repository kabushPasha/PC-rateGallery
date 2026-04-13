import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { MediaPreview } from "./MediaPreview";

export const PreviewGallery: React.FC = observer(() => {
  const project = Project.getInstance();
  const folder = project.selectedFolder;

  // State
  const [columns, setColumns] = useState<number>(3);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [minRating, setMinRating] = useState<number>(0);
  const [maxRating, setMaxRating] = useState<number>(5);


  // Ensure hooks are always called
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !folder) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      else if (e.deltaY < 0) setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    container.addEventListener("wheel", handleWheel);
    return () => container.removeEventListener("wheel", handleWheel);
  }, [folder, currentPage, itemsPerPage, columns]);

  if (!folder) return <div>No folder selected.</div>;
  if (folder.files.length === 0) return <div>No media found in this folder.</div>;


  const filteredFiles = folder.files
    .filter((media) => media.rating >= minRating && media.rating <= maxRating)
    .sort((a, b) => a.name.localeCompare(b.name)); // sort by name alphabetically

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const mediaToShow = filteredFiles.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handleFirst = () => setCurrentPage(1);
  const handleLast = () => setCurrentPage(totalPages);

  const setBookmark = () => {
    folder.setBookmark(currentPage);
  };

  const goToBookmark = () => {
    if (
      folder.bookmark !== null &&
      folder.bookmark >= 1 &&
      folder.bookmark <= totalPages
    ) {
      setCurrentPage(folder.bookmark);
    }
  };

  return (
    <div ref={containerRef} style={{ padding: "1rem" }}>
      {/* Settings */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <label>
          Columns:{" "}
          <input
            type="number"
            min={1}
            max={6}
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            style={{ width: "3rem" }}
          />
        </label>
        <label>
          Items per page:{" "}
          <input
            type="number"
            min={1}
            max={20}
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // reset page
            }}
            style={{ width: "3rem" }}
          />
        </label>
        <label>
          Page:{" "}
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = Number(e.target.value);
              if (!isNaN(page)) setCurrentPage(Math.min(Math.max(page, 1), totalPages));
            }}
            style={{ width: "3rem" }}
          />
          / {totalPages}
        </label>

        {/** BOOKMARKS */}
        <button onClick={setBookmark}> ⭐</button>
        <button onClick={goToBookmark} disabled={folder.bookmark === null}>
          go to page: {folder.bookmark}
        </button>
        {/**RATINGS */}
        <label>
          Min rating{" "}
          <input
            type="number"
            min={0}
            max={5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            style={{ width: "3rem" }}
          />
        </label>

        <label>
          Max rating{" "}
          <input
            type="number"
            min={0}
            max={5}
            value={maxRating}
            onChange={(e) => setMaxRating(Number(e.target.value))}
            style={{ width: "3rem" }}
          />
        </label>


      </div>

      {/* Gallery Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "1rem",
        }}
      >
        {mediaToShow.map((media, index) => (
          <MediaPreview key={index} media={media} width="100%" />
        ))}
      </div>

      {/* Pagination Buttons */}
      {totalPages > 1 && (
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <button onClick={handleFirst} disabled={currentPage === 1}>
            First
          </button>
          <button onClick={handlePrev} disabled={currentPage === 1}>
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page {currentPage} / {totalPages}
          </span>
          <button onClick={handleNext} disabled={currentPage === totalPages}>
            Next
          </button>
          <button onClick={handleLast} disabled={currentPage === totalPages}>
            Last
          </button>
        </div>
      )}
    </div>
  );
});
