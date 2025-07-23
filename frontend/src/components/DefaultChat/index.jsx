import React, { useEffect, useState } from "react";
import {
  GithubLogo,
  GitMerge,
  EnvelopeSimple,
  Plus,
} from "@phosphor-icons/react";
import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from "../Modals/NewWorkspace";
import paths from "@/utils/paths";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "../Sidebar";
import ChatBubble from "../ChatBubble";
import System from "@/models/system";
import UserIcon from "../UserIcon";
import { userFromStorage } from "@/utils/request";
import useUser from "@/hooks/useUser";
import { useTranslation, Trans } from "react-i18next";
import Appearance from "@/models/appearance";
import { useChatMessageAlignment } from "@/hooks/useChatMessageAlignment";

export default function DefaultChatContainer() {
  const { getMessageAlignment } = useChatMessageAlignment();
  const { showScrollbar } = Appearance.getSettings();
  const [mockMsgs, setMockMessages] = useState([]);
  const { user } = useUser();
  const [fetchedMessages, setFetchedMessages] = useState([]);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const popMsg = !window.localStorage.getItem("anythingllm_intro");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      const fetchedMessages = await System.getWelcomeMessages();
      setFetchedMessages(fetchedMessages);
    };
    fetchData();
  }, []);

  const MESSAGES = [
    <React.Fragment key="msg1">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("assistant")}>
          <UserIcon user={{ uid: "system" }} role={"assistant"} />
          <MessageText>{t("welcomeMessage.part1")}</MessageText>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg2">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("assistant")}>
          <UserIcon user={{ uid: "system" }} role={"assistant"} />
          <MessageText>{t("welcomeMessage.part2")}</MessageText>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg3">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("assistant")}>
          <UserIcon user={{ uid: "system" }} role={"assistant"} />
          <div>
            <MessageText>{t("welcomeMessage.part3")}</MessageText>
            <a
              href={paths.github()}
              target="_blank"
              rel="noreferrer"
              className="mt-5 w-fit transition-all duration-300 border border-slate-200 px-4 py-2 rounded-lg text-white light:border-black/50 light:text-theme-text-primary text-sm items-center flex gap-x-2 hover:bg-slate-200 hover:text-slate-800 focus:ring-gray-800"
            >
              <GitMerge className="h-4 w-4" />
              <p>{t("welcomeMessage.githubIssue")}</p>
            </a>
          </div>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg4">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("user")}>
          <UserIcon user={{ uid: userFromStorage()?.username }} role={"user"} />
          <MessageText>{t("welcomeMessage.user1")}</MessageText>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg5">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("assistant")}>
          <UserIcon user={{ uid: "system" }} role={"assistant"} />
          <div>
            <MessageText>{t("welcomeMessage.part4")}</MessageText>

            {(!user || user?.role !== "default") && (
              <button
                onClick={showNewWsModal}
                className="mt-5 w-fit transition-all duration-300 border border-slate-200 px-4 py-2 rounded-lg text-white light:border-black/50 light:text-theme-text-primary text-sm items-center flex gap-x-2 hover:bg-slate-200 hover:text-slate-800 focus:ring-gray-800"
              >
                <Plus className="h-4 w-4" />
                <p>{t("welcomeMessage.createWorkspace")}</p>
              </button>
            )}
          </div>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg6">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("user")}>
          <UserIcon user={{ uid: userFromStorage()?.username }} role={"user"} />
          <MessageText>{t("welcomeMessage.user2")}</MessageText>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg7">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("assistant")}>
          <UserIcon user={{ uid: "system" }} role={"assistant"} />
          <MessageText>
            <Trans
              i18nKey="welcomeMessage.part5"
              components={{
                i: <i />,
                br: <br />,
              }}
            />
          </MessageText>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg8">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("user")}>
          <UserIcon user={{ uid: userFromStorage()?.username }} role={"user"} />
          <MessageText>{t("welcomeMessage.user3")}</MessageText>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,

    <React.Fragment key="msg9">
      <MessageContainer>
        <MessageContent alignmentCls={getMessageAlignment("assistant")}>
          <UserIcon user={{ uid: "system" }} role={"assistant"} />
          <div>
            <MessageText>{t("welcomeMessage.part6")}</MessageText>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4">
              <a
                href={paths.github()}
                target="_blank"
                rel="noreferrer"
                className="mt-5 w-fit transition-all duration-300 border border-slate-200 px-4 py-2 rounded-lg text-white light:border-black/50 light:text-theme-text-primary text-sm items-center flex gap-x-2 hover:bg-slate-200 hover:text-slate-800 focus:ring-gray-800"
              >
                <GithubLogo className="h-4 w-4" />
                <p>{t("welcomeMessage.starOnGitHub")}</p>
              </a>
              <a
                href={paths.mailToMintplex()}
                className="mt-5 w-fit transition-all duration-300 border border-slate-200 px-4 py-2 rounded-lg text-white light:border-black/50 light:text-theme-text-primary text-sm items-center flex gap-x-2 hover:bg-slate-200 hover:text-slate-800 focus:ring-gray-800"
              >
                <EnvelopeSimple className="h-4 w-4" />
                <p>{t("welcomeMessage.contact")}</p>
              </a>
            </div>
          </div>
        </MessageContent>
      </MessageContainer>
    </React.Fragment>,
  ];

  useEffect(() => {
    function processMsgs() {
      if (!!window.localStorage.getItem("anythingllm_intro")) {
        setMockMessages([...MESSAGES]);
        return false;
      } else {
        setMockMessages([MESSAGES[0]]);
      }

      var timer = 500;
      var messages = [];

      MESSAGES.map((child) => {
        setTimeout(() => {
          setMockMessages([...messages, child]);
          messages.push(child);
        }, timer);
        timer += 2_500;
      });
      window.localStorage.setItem("anythingllm_intro", 1);
    }

    processMsgs();
  }, []);

  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className={`transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary light:border-[1px] light:border-theme-sidebar-border w-full h-full overflow-y-scroll ${
        showScrollbar ? "show-scrollbar" : "no-scroll"
      }`}
    >
      {isMobile && <SidebarMobileHeader />}
      {fetchedMessages.length === 0
        ? mockMsgs.map((content, i) => {
            return <React.Fragment key={i}>{content}</React.Fragment>;
          })
        : fetchedMessages.map((fetchedMessage, i) => {
            return (
              <React.Fragment key={i}>
                <ChatBubble
                  message={
                    fetchedMessage.user === ""
                      ? fetchedMessage.response
                      : fetchedMessage.user
                  }
                  type={fetchedMessage.user === "" ? "response" : "user"}
                  popMsg={popMsg}
                />
              </React.Fragment>
            );
          })}
      {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
    </div>
  );
}

function MessageContainer({ children }) {
  return (
    <div className="w-full py-6 px-4">
      <div className="flex w-full justify-start">{children}</div>
    </div>
  );
}

function MessageContent({ children, alignmentCls = "" }) {
  return (
    <div
      className={`flex gap-x-3 max-w-[85%] md:max-w-[75%] flex-row ${alignmentCls}`}
    >
      <div className="flex-shrink-0 self-end">{children[0]}</div>
      <div className="flex flex-col min-w-0">{children.slice(1)}</div>
    </div>
  );
}

function MessageText({ children }) {
  return (
    <div className="relative bubble-message bubble-assistant">
      <div className="bg-theme-bg-chat-input light:bg-gray-200 text-theme-text-primary light:text-gray-700 p-4 rounded-2xl shadow-lg rounded-bl-md break-words">
        <span className="font-light text-[14px] flex flex-col gap-y-1">
          {children}
        </span>
      </div>
      {/* Bubble tail */}
      <div className="absolute bottom-0 left-0 transform -translate-x-2 w-4 h-4 bubble-tail-assistant"></div>
    </div>
  );
}
