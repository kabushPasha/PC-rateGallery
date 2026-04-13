import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { MediaPreview } from "./MediaPreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup } from "react-bootstrap";

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
  }, [folder]);



  // On folder changed - set first page
  useEffect(() => {
    if (!folder) return;
    const entry = project.database?.getFolderEntry(folder.path);
    const last_rating = entry?.lastRating ?? 0;
    const last_page = entry?.lastPageByRating[last_rating] ?? 1;
    setMinRating(last_rating);
    setCurrentPage(Math.max(last_page, 1));
  }, [folder]);

  useEffect(() => {
    if (!folder) return;
    const entry = project.database?.getFolderEntry(folder.path);
    const last_page = entry?.lastPageByRating[minRating] ?? 1;
    project.database?.setFolderRating(folder.path, minRating);
    setCurrentPage(Math.max(last_page, 1));
  }, [minRating]);


  // On page changed - store
  useEffect(() => {
    if (folder) project.database?.setFolderPage(folder?.path, minRating, currentPage)
  }, [currentPage])



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

        <ButtonGroup className="me-2" aria-label="rating group">
          {[0, 1, 2, 3, 4, 5].map((rating) => (
            <RatingButton
              key={rating}
              rating={rating}
              count={folder.ratingStats.ratings[rating-1]}
              onClick={setMinRating}
            />
          ))}
        </ButtonGroup>

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
        {mediaToShow.map((media, _) => (
          <MediaPreview key={media.path} media={media} width="100%" />
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





type RatingButtonProps = {
  rating: number;
  count: number;
  onClick: (rating: number) => void;
};

export default function RatingButton({
  rating,
  count,
  onClick,
}: RatingButtonProps) {
  return (
    <Button
      onClick={() => onClick(rating)}
      className="position-relative overflow-hidden"
    >
      <FontAwesomeIcon
        icon={faStar}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.2,
          fontSize: "1.35rem",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <span style={{ position: "relative", zIndex: 1 }}>
        {count}
      </span>
    </Button>
  );
}