import React, { useState, useRef, useEffect } from "react";
import {
  X,
  PaperPlaneTilt,
  ArrowCounterClockwise,
  Sparkle,
  FileText,
  ChatCircle,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

const DocumentQAOverlay = ({
  document,
  workspaceSlug,
  onClose,
  onHighlightSources,
  currentPage = 1,
}) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setError(null);
    setIsLoading(true);

    // Add user message to conversation
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: currentQuestion,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        `/v1/workspace/${workspaceSlug}/document/${document.id}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + (localStorage.getItem("anythingllm_authToken") || ""),
          },
          body: JSON.stringify({
            question: currentQuestion,
            contextMode: "document",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: "assistant",
          content:
            data.response.textResponse ||
            data.response.text ||
            "No response received",
          sourceMapping: data.response.sourceMapping || [],
          timestamp: new Date().toISOString(),
          metadata: {
            sourcesFound: data.response.sourceMapping?.length || 0,
            questionLength: currentQuestion.length,
          },
        };

        setConversations((prev) => [...prev, assistantMessage]);

        // Highlight sources in document if available
        if (
          data.response.sourceMapping &&
          data.response.sourceMapping.length > 0
        ) {
          onHighlightSources(data.response.sourceMapping);
        }
      } else {
        throw new Error(data.error || "Failed to process question");
      }
    } catch (err) {
      console.error("Q&A Error:", err);
      setError(err.message);

      // Add error message to conversation
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setConversations([]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleQuickQuestion = (quickQuestion) => {
    setQuestion(quickQuestion);
    inputRef.current?.focus();
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Can you summarize the key points?",
    "What are the most important findings?",
    "Are there any conclusions or recommendations?",
    "What methodology was used in this study?",
  ];

  return (
    <div className="w-96 bg-white border-l border-gray-300 flex flex-col h-full">
      {/* Header */}
      <div className="bg-blue-50 border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChatCircle size={20} className="text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-800">Ask Questions</h3>
            <p className="text-xs text-gray-600">
              About: {document.title || document.filename}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
          title="Close Q&A panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Document Info */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText size={16} />
          <span className="truncate">
            {document.type} • Page {currentPage}
          </span>
        </div>
        {document.metadata?.wordCount && (
          <div className="text-xs text-gray-500 mt-1">
            {document.metadata.wordCount.toLocaleString()} words •{" "}
            {document.chunks?.length || 0} chunks
          </div>
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Sparkle size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm mb-4">Ask any question about this document</p>

            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Suggested Questions:
              </p>
              {suggestedQuestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(suggestion)}
                  className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded border text-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversations.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : message.type === "error"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* Source count for assistant messages */}
                {message.type === "assistant" &&
                  message.sourceMapping &&
                  message.sourceMapping.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>
                          {message.sourceMapping.length} source
                          {message.sourceMapping.length !== 1 ? "s" : ""}{" "}
                          highlighted
                        </span>
                      </div>
                    </div>
                  )}

                {/* Timestamp */}
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">
                  Analyzing document...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {conversations.length > 0 && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={handleClearConversation}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <ArrowCounterClockwise size={14} />
              <span>Clear conversation</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitQuestion} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this document..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send question"
          >
            <PaperPlaneTilt size={16} />
          </button>
        </form>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Sources will be highlighted in the document
        </div>
      </div>
    </div>
  );
};

export default DocumentQAOverlay;
