import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Send } from "lucide-react";
import { useChatStore } from "../../../features/chat/state/ChatContext";
import { usePlansStore } from "../../../features/plans/state/PlansContext";
import { useProfileStore } from "../../../features/profile/state/ProfileContext";
import { UserAvatar } from "../../../IMGfromDB/UserAvatar";
import { CircleAvatar } from "../../../shared/components/CircleAvatar";
import { DateBadge } from "../components/DateBadge";
import wallpaperCover from "../../../assets/chat_wallpaper.png";

interface CircleChatScreenProps {
  circle: any;
  dbUsers?: any[];
  onBack: () => void;
  onHeaderClick?: () => void;
  onNavigateToCirclePlans: () => void;
}

export const CircleChatScreen: React.FC<CircleChatScreenProps> = ({
  circle,
  dbUsers = [],
  onBack,
  onHeaderClick,
  onNavigateToCirclePlans,
}) => {
  const { plans } = usePlansStore();
  const { activeUserUuid } = useProfileStore();
  const circleUuid = circle.dbUuid || circle.id;

  const {
    messages,
    isLoading: isChatLoading,
    connectionStatus,
    setActiveRoom,
    sendMessage,
  } = useChatStore();

  const [typedMessage, setTypedMessage] = useState('');

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Activate this Circle's chat room in the shared ChatContext
  useEffect(() => {
    setActiveRoom(circleUuid);
  }, [circleUuid, setActiveRoom]);

  // Handle dynamic height for mobile browser virtual keyboards
  const [viewportHeight, setViewportHeight] = useState<string>("100%");
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
        const offset = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(offset > 50 ? offset : 0);
        window.scrollTo(0, 0);
      }
    };
    window.visualViewport.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!typedMessage.trim()) return;
    try {
      await sendMessage(typedMessage.trim());
      setTypedMessage('');
    } catch (err) {
      console.error("[CircleChatScreen] Failed to send message:", err);
    }
  };

  const title = circle.name;

  // Display Circle member names in the subtitle
  const subtitle = useMemo(() => {
    const list = circle.membersList || circle.members || [];
    if (list.length === 0) return "No members";
    const names = list.map((m: any) => {
      const uId = m.userId || m.id;
      const matchedUser = dbUsers.find(u => u.id === uId || u.user_id === uId);
      return matchedUser?.full_name?.split(" ")[0] || m.name?.split(" ")[0] || "User";
    }).filter(Boolean);

    if (names.length <= 3) return names.join(", ");
    const visible = names.slice(0, 3).join(", ");
    const remaining = names.length - 3;
    return `${visible} +${remaining}`;
  }, [circle.membersList, circle.circle_id, dbUsers]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return "";
    }
  };

  // All plans in this Circle
  const plansInCircleCount = useMemo(() => {
    return plans.filter((p: any) =>
      (p.circleId === circleUuid || p.circleId === circle.id)
    ).length;
  }, [plans, circleUuid, circle.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col bg-[#000000] relative overflow-hidden select-text font-sans w-full"
      style={{
        height: viewportHeight,
        paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined,
        backgroundImage: `url(${wallpaperCover})`,
        backgroundSize: "290px auto",
        backgroundRepeat: "repeat",
      }}
    >
      {/* Header */}
      <div
        id="circle-chat-header"
        className="px-6 py-3 flex items-center justify-between border-b border-zinc-900 bg-[#000000]/95 backdrop-blur-md absolute top-0 left-0 right-0 z-20 flex-shrink-0 text-left h-14"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-full text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={onHeaderClick}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-all select-none min-w-0"
          >
            <CircleAvatar
              src={circle.groupPhoto || circle.group_photo || circle.coverImage || circle.groupImage || (circle as any).cover_image}
              alt={title}
              size="w-9 h-9"
              className="border border-zinc-800 shadow-sm"
            />
            <div className="min-w-0 leading-tight">
              <h3 className="text-[14px] font-semibold text-white/90 truncate max-w-[180px] tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-500 truncate font-normal mt-0.5 max-w-[200px]">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Plans quick-access button */}
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={onNavigateToCirclePlans}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white text-[11px] font-semibold tracking-wide transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Plans</span>
            <span className="text-[9px] bg-white text-black font-extrabold rounded-full w-4.5 h-4.5 flex items-center justify-center">
              {plansInCircleCount}
            </span>
          </button>
        </div>
      </div>

      {/* Floating System Date Badge */}
      <div className="absolute top-14 left-0 right-0 z-10 flex justify-center pt-2 select-none">
        <DateBadge />
      </div>

      {/* Message List Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col pt-14 max-h-[calc(100%-3.8rem)] relative"
      >
        <div className="flex-1 px-6 pb-4 pt-16 space-y-4 flex flex-col justify-end min-h-full">

          {isChatLoading ? (
            <div className="text-center py-6 text-zinc-600 text-[10px] font-semibold uppercase tracking-wider select-none">
              Loading messages...
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.isOwn;
              const senderName = msg.sender?.name || "Member";
              const senderAvatar = msg.sender?.avatar || null;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] items-end ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <UserAvatar
                    src={senderAvatar}
                    alt={senderName}
                    size="w-6.5 h-6.5"
                    className="border border-zinc-800 flex-shrink-0 select-none shadow-sm"
                  />
                  <div className="flex flex-col">
                    {!isMe && (
                      <span className="text-[10px] font-semibold text-zinc-500 font-sans ml-1.5 mb-0.5 select-none text-left">
                        {senderName}
                      </span>
                    )}
                    <div
                      className={`relative rounded-xl py-2 px-3 text-[13px] leading-relaxed break-words font-sans text-left shadow-sm ${isMe
                          ? 'bg-white text-black font-medium'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-850 font-normal'
                        }`}
                    >
                      <span>{msg.content}</span>
                      <span className={`text-[9px] block text-right mt-1 leading-none select-none ${isMe ? 'text-black/50' : 'text-zinc-500'}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Message Composer (placed on top of the wallpaper with transparent container) */}
      <div className="p-3 bg-transparent flex items-center gap-3">
        <input
          type="text"
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Drop a message..."
          className="flex-1 bg-zinc-900/90 hover:bg-zinc-850/90 focus:bg-zinc-900/95 backdrop-blur-md transition-all border border-zinc-800 focus:border-zinc-700 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-zinc-500 outline-none w-full"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!typedMessage.trim()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0 ${typedMessage.trim()
              ? 'bg-white text-black hover:bg-zinc-100'
              : 'bg-zinc-900/90 text-zinc-650 border border-zinc-800 cursor-not-allowed backdrop-blur-md'
            }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
