import React, { useState, useEffect, useRef } from "react";

const PDFHighlighter = ({
  highlights = [],
  pageNumber,
  scale = 1.0,
  pdfPageRef,
}) => {
  const [hoveredHighlight, setHoveredHighlight] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [textItems, setTextItems] = useState([]);
  const containerRef = useRef(null);

  // Filter highlights for current page
  const pageHighlights = highlights.filter(
    (h) => h.pageNumber === pageNumber || (!h.pageNumber && pageNumber === 1)
  );

  // Extract text items from PDF page for coordinate mapping
  useEffect(() => {
    const extractTextItems = async () => {
      if (!pdfPageRef?.current) return;

      try {
        // Get the PDF page element
        const pageElement =
          pdfPageRef.current.querySelector(".react-pdf__Page");
        const textLayer = pageElement?.querySelector(
          ".react-pdf__Page__textContent"
        );

        if (textLayer) {
          // Get all text elements
          const textElements = textLayer.querySelectorAll("span");
          const items = Array.from(textElements).map((span, index) => {
            const rect = span.getBoundingClientRect();
            const pageRect = pageElement.getBoundingClientRect();

            return {
              text: span.textContent,
              left: (rect.left - pageRect.left) / scale,
              top: (rect.top - pageRect.top) / scale,
              width: rect.width / scale,
              height: rect.height / scale,
              element: span,
              index,
            };
          });

          setTextItems(items);
        }
      } catch (error) {
        console.error("Error extracting PDF text items:", error);
      }
    };

    // Wait for PDF page to render
    const timer = setTimeout(extractTextItems, 500);
    return () => clearTimeout(timer);
  }, [pageNumber, scale, pdfPageRef]);

  const findTextCoordinates = (searchText) => {
    if (!textItems.length) return [];

    const matches = [];
    const searchLower = searchText.toLowerCase().trim();

    // Simple text matching - can be enhanced for better accuracy
    for (let i = 0; i < textItems.length; i++) {
      const item = textItems[i];
      const itemText = item.text.toLowerCase();

      if (itemText.includes(searchLower)) {
        matches.push({
          ...item,
          matchText: searchText,
        });
      }
    }

    // Try multi-word matching across adjacent text items
    if (matches.length === 0 && searchLower.includes(" ")) {
      const words = searchLower.split(" ");
      for (let i = 0; i < textItems.length - words.length + 1; i++) {
        const textChunk = textItems
          .slice(i, i + words.length)
          .map((item) => item.text.toLowerCase())
          .join(" ");

        if (textChunk.includes(searchLower)) {
          const startItem = textItems[i];
          const endItem = textItems[i + words.length - 1];

          matches.push({
            text: searchText,
            left: startItem.left,
            top: startItem.top,
            width: endItem.left + endItem.width - startItem.left,
            height: Math.max(startItem.height, endItem.height),
            matchText: searchText,
            isMultiWord: true,
          });
        }
      }
    }

    return matches;
  };

  const handleHighlightHover = (highlight, event) => {
    setHoveredHighlight(highlight);

    // Calculate tooltip position
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setTooltipPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 10,
      });
    }
  };

  const handleHighlightLeave = () => {
    setHoveredHighlight(null);
  };

  const handleHighlightClick = (highlight) => {
    console.log("Clicked PDF highlight:", highlight);

    // Could trigger additional actions like:
    // - Show full context in a modal
    // - Scroll to related text
    // - Show similarity score details
  };

  const getHighlightStyle = (highlight) => {
    const baseStyle = {
      position: "absolute",
      borderRadius: "2px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      zIndex: 20,
      pointerEvents: "auto",
      opacity: 0.7,
    };

    // Determine color based on similarity or type
    let backgroundColor, borderColor;

    if (highlight.isSearch) {
      backgroundColor = "rgba(0, 100, 255, 0.4)";
      borderColor = "rgba(0, 100, 255, 0.6)";
    } else {
      const similarity = highlight.similarity || 0;
      if (similarity > 0.9) {
        backgroundColor = "rgba(255, 50, 50, 0.4)";
        borderColor = "rgba(255, 50, 50, 0.6)";
      } else if (similarity > 0.8) {
        backgroundColor = "rgba(255, 140, 0, 0.4)";
        borderColor = "rgba(255, 140, 0, 0.6)";
      } else if (similarity > 0.7) {
        backgroundColor = "rgba(255, 215, 0, 0.4)";
        borderColor = "rgba(255, 215, 0, 0.6)";
      } else {
        backgroundColor = "rgba(50, 205, 50, 0.4)";
        borderColor = "rgba(50, 205, 50, 0.6)";
      }
    }

    return {
      ...baseStyle,
      backgroundColor: highlight.color || backgroundColor,
      border: `1px solid ${borderColor}`,
      boxShadow: "0 0 3px rgba(0,0,0,0.2)",
    };
  };

  const renderHighlightElements = () => {
    return pageHighlights.map((highlight, index) => {
      // Find text coordinates in PDF
      const coordinates = findTextCoordinates(highlight.content);

      return coordinates.map((coord, coordIndex) => (
        <div
          key={`${highlight.id}-${coordIndex}`}
          className="pdf-highlight"
          style={{
            ...getHighlightStyle(highlight),
            left: `${coord.left * scale}px`,
            top: `${coord.top * scale}px`,
            width: `${coord.width * scale}px`,
            height: `${coord.height * scale}px`,
            transform: `scale(1)`, // Don't double-scale
          }}
          onMouseEnter={(e) => handleHighlightHover(highlight, e)}
          onMouseLeave={handleHighlightLeave}
          onClick={() => handleHighlightClick(highlight)}
          title={getHighlightTooltipContent(highlight)}
        />
      ));
    });
  };

  const getHighlightTooltipContent = (highlight) => {
    if (highlight.isSearch) {
      return `Search result: "${highlight.content}"`;
    }

    const similarity = highlight.similarity || 0;
    const relevanceText =
      similarity > 0.9
        ? "High"
        : similarity > 0.8
          ? "Medium-High"
          : similarity > 0.7
            ? "Medium"
            : "Low";

    return `${relevanceText} relevance (${Math.round(similarity * 100)}%) - Click for details`;
  };

  if (pageHighlights.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15 }}
    >
      {renderHighlightElements()}

      {/* Tooltip */}
      {hoveredHighlight && (
        <div
          className="pdf-highlight-tooltip visible"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            position: "absolute",
            background: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            maxWidth: "250px",
            zIndex: 1000,
            pointerEvents: "none",
            transform: "translateX(-50%) translateY(-100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="font-medium mb-1">
            {hoveredHighlight.isSearch ? "Search Result" : "Source Reference"}
          </div>
          <div className="text-xs opacity-90">
            {hoveredHighlight.isSearch
              ? `"${hoveredHighlight.content}"`
              : `Relevance: ${Math.round((hoveredHighlight.similarity || 0) * 100)}%`}
          </div>
          {hoveredHighlight.metadata?.chunkIndex !== undefined && (
            <div className="text-xs opacity-75 mt-1">
              Chunk {hoveredHighlight.metadata.chunkIndex}
            </div>
          )}
        </div>
      )}

      {/* Highlight Legend - positioned for PDF view */}
      {pageHighlights.length > 0 && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg p-3 text-xs pointer-events-auto shadow-lg border">
          <div className="font-medium mb-2">
            Highlights ({pageHighlights.length})
          </div>
          <div className="space-y-1">
            {pageHighlights.some((h) => h.similarity > 0.9) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded opacity-70"></div>
                <span>High relevance</span>
              </div>
            )}
            {pageHighlights.some(
              (h) => h.similarity > 0.8 && h.similarity <= 0.9
            ) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded opacity-70"></div>
                <span>Medium-high relevance</span>
              </div>
            )}
            {pageHighlights.some(
              (h) => h.similarity > 0.7 && h.similarity <= 0.8
            ) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded opacity-70"></div>
                <span>Medium relevance</span>
              </div>
            )}
            {pageHighlights.some((h) => h.similarity <= 0.7 && !h.isSearch) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded opacity-70"></div>
                <span>Lower relevance</span>
              </div>
            )}
            {pageHighlights.some((h) => h.isSearch) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded opacity-70"></div>
                <span>Search results</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFHighlighter;
