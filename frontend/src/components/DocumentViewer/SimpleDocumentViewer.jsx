import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChatCircle,
  MagnifyingGlass,
  FileText,
  DownloadSimple,
} from "@phosphor-icons/react";
import DocumentQAOverlay from "./DocumentQAOverlay";
import "./DocumentViewer.css";

const SimpleDocumentViewer = ({
  documentId,
  workspaceSlug,
  onClose,
  initialDocument = null,
}) => {
  const [document, setDocument] = useState(initialDocument);
  const [isLoading, setIsLoading] = useState(!initialDocument);
  const [error, setError] = useState(null);
  const [showQAOverlay, setShowQAOverlay] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Load document data
  useEffect(() => {
    const loadDocument = async () => {
      if (initialDocument) {
        setDocument(initialDocument);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/workspace/${workspaceSlug}/document/${documentId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setDocument(data.document);
        } else {
          throw new Error(data.error || "Failed to load document");
        }
      } catch (err) {
        console.error("Document loading error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId, workspaceSlug, initialDocument]);

  const handleDownload = () => {
    if (document?.source) {
      window.open(document.source, "_blank");
    }
  };

  const handleHighlightSources = useCallback((sources) => {
    // Convert source mapping to highlight data
    const newHighlights = sources.map((source) => ({
      id: source.chunkId,
      content: source.content,
      similarity: source.similarity,
      startOffset: source.metadata?.startOffset,
      endOffset: source.metadata?.endOffset,
      color: getHighlightColor(source.similarity),
    }));

    setHighlights((prev) => [...prev, ...newHighlights]);
  }, []);

  const getHighlightColor = (similarity) => {
    if (similarity > 0.9) return "rgba(255, 0, 0, 0.3)"; // Red for highest relevance
    if (similarity > 0.8) return "rgba(255, 165, 0, 0.3)"; // Orange
    if (similarity > 0.7) return "rgba(255, 255, 0, 0.3)"; // Yellow
    return "rgba(0, 255, 0, 0.3)"; // Green for lower relevance
  };

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setHighlights((prev) => prev.filter((h) => !h.isSearch));
      return;
    }

    setIsSearching(true);
    try {
      // Simple text search highlighting
      const searchHighlights = [
        {
          id: `search-${Date.now()}`,
          content: term,
          color: "rgba(0, 0, 255, 0.3)", // Blue for search
          isSearch: true,
        },
      ];

      setHighlights((prev) =>
        prev.filter((h) => !h.isSearch).concat(searchHighlights)
      );
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearHighlights = () => {
    setHighlights([]);
  };

  const renderHighlightedContent = (content) => {
    if (!content || highlights.length === 0) {
      return content;
    }

    let highlightedContent = content;
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight.content})`, "gi");
      highlightedContent = highlightedContent.replace(
        regex,
        `<mark style="background-color: ${highlight.color};">$1</mark>`
      );
    });

    return highlightedContent;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Document</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
      {/* Document Viewer Panel */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Close"
            >
              <X size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate max-w-xs">
              {document.title || document.filename}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleSearch(searchTerm)
                }
                className="pl-8 pr-4 py-1 border border-gray-300 rounded text-sm w-48"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Document Info */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText size={16} />
              <span>
                {document.type} •{" "}
                {document.metadata?.wordCount?.toLocaleString() || 0} words
              </span>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Download document"
            >
              <DownloadSimple size={20} />
            </button>

            {/* Toggle Q&A Overlay */}
            <button
              onClick={() => setShowQAOverlay(!showQAOverlay)}
              className={`p-2 rounded ${
                showQAOverlay
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Ask questions about this document"
            >
              <ChatCircle size={20} />
            </button>

            {/* Clear Highlights */}
            {highlights.length > 0 && (
              <button
                onClick={clearHighlights}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                title="Clear highlights"
              >
                Clear highlights ({highlights.length})
              </button>
            )}
          </div>
        </div>

        {/* Document Content */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <div
              ref={contentRef}
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: renderHighlightedContent(
                  document.content || "No content available"
                ),
              }}
            />

            {/* Document metadata */}
            {document.metadata && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  Document Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {document.metadata.wordCount && (
                    <div>
                      <span className="font-medium">Word Count:</span>{" "}
                      {document.metadata.wordCount.toLocaleString()}
                    </div>
                  )}
                  {document.metadata.token_count_estimate && (
                    <div>
                      <span className="font-medium">Estimated Tokens:</span>{" "}
                      {document.metadata.token_count_estimate.toLocaleString()}
                    </div>
                  )}
                  {document.source && (
                    <div className="col-span-2">
                      <span className="font-medium">Source:</span>{" "}
                      {document.source}
                    </div>
                  )}
                  {document.chunks && (
                    <div>
                      <span className="font-medium">Chunks:</span>{" "}
                      {document.chunks.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Q&A Overlay Panel */}
      {showQAOverlay && (
        <DocumentQAOverlay
          document={document}
          workspaceSlug={workspaceSlug}
          onClose={() => setShowQAOverlay(false)}
          onHighlightSources={handleHighlightSources}
        />
      )}
    </div>
  );
};

export default SimpleDocumentViewer;
