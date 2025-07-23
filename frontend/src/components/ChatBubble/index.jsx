import React from "react";
import UserIcon from "../UserIcon";
import { userFromStorage } from "@/utils/request";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "@/utils/chat/purify";

export default function ChatBubble({ message, type, popMsg }) {
  const isUser = type === "user";

  return (
    <div className="w-full bg-theme-bg-secondary py-6 px-4">
      {/* Main message container */}
      <div
        className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex gap-x-3 max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Profile image container */}
          <div className="flex-shrink-0 self-end">
            <UserIcon
              user={{ uid: isUser ? userFromStorage()?.username : "system" }}
              role={type}
            />
          </div>

          {/* Message content */}
          <div
            className={`relative bubble-message ${isUser ? "bubble-user" : "bubble-assistant"}`}
          >
            <div
              className={`markdown whitespace-pre-line font-normal text-sm md:text-sm p-4 rounded-2xl shadow-lg break-words ${
                isUser
                  ? "bg-blue-600 light:bg-blue-500 text-white rounded-br-md"
                  : "bg-theme-bg-chat-input light:bg-gray-200 text-theme-text-primary light:text-gray-700 rounded-bl-md"
              }`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(renderMarkdown(message)),
              }}
            />
            {/* Bubble tail */}
            <div
              className={`absolute bottom-0 w-4 h-4 ${
                isUser
                  ? "right-0 transform translate-x-2 bubble-tail-user"
                  : "left-0 transform -translate-x-2 bubble-tail-assistant"
              }`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
