import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Calendar, 
  CreditCard, 
  Users, 
  Clock,
  Flame,
  Plus,
  Trophy,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../../../core/types';
import { NotificationMeta } from '../../../lib/mappers';

interface CompletedMemoryItem {
  memory: any;
  plan: any;
  title: string;
  subtitle: string;
  isPending: boolean;
}

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  onBack: () => void;
  onAcceptInvite: (notif: NotificationItem) => void;
  onOpenNotification: (notif: NotificationItem) => void;
  completedMemories?: CompletedMemoryItem[];
  onSelectMemoryPlan?: (plan: any) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ 
  notifications, 
  onBack,
  onAcceptInvite,
  onOpenNotification,
  completedMemories = [],
  onSelectMemoryPlan
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'plans' | 'payments' | 'activity'>('all');

  // Map notification type to category
  const getNotificationCategory = (type: string): 'plans' | 'payments' | 'activity' => {
    if (
      type === 'PLAN_INVITATION' || 
      type === 'WAITLIST_PROMOTED' || 
      type === 'PLAN_CANCELLED' || 
      type === 'PLAN_UPDATED' || 
      type === 'invitation'
    ) {
      return 'plans';
    }
    if (type === 'payment') {
      return 'payments';
    }
    return 'activity';
  };

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return getNotificationCategory(n.type) === activeTab;
  });

  // Helper to dynamically get the beautiful subtle monochrome category icons representation
  const getCategoryIcon = (type?: string) => {
    const sizeClass = "w-4 h-4 text-zinc-400 stroke-[1.8]";
    switch (type) {
      case 'PLAN_INVITATION':
      case 'invitation':
        return <Calendar className={sizeClass} />;
      case 'WAITLIST_PROMOTED':
        return <Clock className={sizeClass} />;
      case 'payment':
        return <CreditCard className={sizeClass} />;
      case 'PARTICIPANT_JOINED':
      case 'HOST_TRANSFERRED':
        return <Users className={sizeClass} />;
      default:
        return <Bell className={sizeClass} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full bg-black animate-fade-in text-white text-left">
      
      {/* HEADER ROW WITH BACK TRIGGER AND CENTERED WORDMARK */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.02] select-none flex-shrink-0 relative z-25 bg-black/80 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/60 border border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-900 transition active:scale-95 cursor-pointer focus:outline-none focus:ring-0"
          aria-label="Go Back"
          id="btn-notifications-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-sans font-bold tracking-[0.3em] text-white uppercase select-none">
          PLANLESS
        </h1>
        
        {/* Transparent placeholder to match alignment balance */}
        <div className="w-8 h-8"></div>
      </div>

      {/* BODY WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 pt-5 pb-24 relative select-none">
        
        {/* CLEAN MINIMAL TITLE Row */}
        <div className="mb-5">
          <h2 className="font-sans font-extrabold text-[28px] tracking-tight text-white">
            Notifications
          </h2>
        </div>

        {/* PILL FILTERS */}
        <div className="grid grid-cols-4 gap-2 pb-4 select-none flex-shrink-0 w-full">
          {(['all', 'plans', 'payments', 'activity'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1.5 rounded-full text-xs font-sans font-semibold border transition-all duration-200 capitalize cursor-pointer select-none text-center flex items-center justify-center focus:outline-none focus:ring-0 focus-visible:outline-none ${
                  isActive 
                    ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white shadow-lg shadow-[#FF6B2C]/10' 
                    : 'bg-zinc-900/60 border-white/[0.04] text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-white/[0.08]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* FEED / CONTENT SWITCHER */}
        <div className="flex-1 overflow-y-auto scrollbar-none mt-2 relative flex flex-col space-y-4">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 && completedMemories.length === 0 ? (
              
              /* STUNNING REDESIGNED GLASSMORPHIC EMPTY STATE ILLUSTRATION */
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col items-center justify-center text-center px-4 relative h-full"
              >
                {/* 50% Softer/Subtle warm red/orange background glow mask */}
                <div className="absolute w-36 h-36 rounded-full bg-[#FF6B2C]/3 blur-[32px] pointer-events-none"></div>

                {/* Satellite Circular Floating Dashboard Elements */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  
                  {/* Central Glow Ring Card */}
                  <div className="w-20 h-20 rounded-[22px] bg-zinc-950 border border-white/[0.08] flex items-center justify-center shadow-2xl relative z-10">
                    <Bell className="w-8 h-8 text-zinc-400 stroke-[1.6] animate-none" />
                    <span className="absolute top-5 right-5 w-2 h-2 bg-[#FF6B2C] rounded-full animate-pulse"></span>
                  </div>

                  {/* Satellites */}
                  <div className="absolute top-1.5 left-4 w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg transition duration-300">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute top-4 right-5 w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg transition duration-300">
                    <Plus className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg transition duration-300">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg transition duration-300">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-4 left-5 w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg transition duration-300">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-2 right-4 w-7 h-7 rounded-lg bg-zinc-900/90 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg transition duration-300">
                    <Users className="w-3.5 h-3.5" />
                  </div>

                  <svg className="absolute inset-0 w-full h-full text-zinc-900/40 pointer-events-none" viewBox="0 0 192 192">
                    <circle cx="96" cy="96" r="62" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
                    <circle cx="96" cy="96" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
                  </svg>
                </div>

                <h3 className="font-sans font-bold text-lg text-white mb-1 tracking-tight">
                  No updates yet
                </h3>
                <p className="text-zinc-500 text-[11.5px] font-sans max-w-[240px] leading-relaxed mx-auto">
                  Invites, plan updates, and reminders will appear here.
                </p>

              </motion.div>
            ) : (
              
              /* COMPACT NOTIFICATION FEED */
              <motion.div 
                key="notification-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {filteredNotifications.map((notif) => {
                  const meta = NotificationMeta[notif.type] || { label: "Notification", icon: "🔔" };
                  return (
                    <motion.div
                      layout
                      key={notif.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => onOpenNotification(notif)}
                      className={`p-4 bg-zinc-900/40 border border-white/[0.04] rounded-2xl flex flex-col space-y-2 hover:border-[#FF6B2C]/20 transition duration-150 cursor-pointer ${notif.settled ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {getCategoryIcon(notif.type)}
                        </div>
                        <span className="text-[10px] font-bold font-mono text-[#FF6B2C] uppercase tracking-wider">
                          {meta.label}
                        </span>
                        {!notif.settled && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]"></span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                          {notif.relativeTime}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-sm font-sans font-bold text-zinc-100">
                          {notif.title}
                        </h4>
                        {notif.body && (
                          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                            {notif.body}
                          </p>
                        )}
                      </div>

                      {!notif.settled && notif.actionText && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcceptInvite(notif);
                          }}
                          className="bg-[#FF6B2C] text-black text-[9.5px] font-black uppercase font-mono px-4 py-1.5 rounded-lg focus:outline-none cursor-pointer self-start active:scale-95 transition"
                        >
                          {notif.actionText}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* COMPLETED MEMORIES ROW IN NOTIFICATION TAB */}
          {activeTab === 'all' && completedMemories.length > 0 && (
            <div className="border-t border-white/[0.04] pt-4 space-y-3">
              <h4 className="text-[10px] font-mono text-[#FF6B2C] uppercase tracking-widest font-black px-1">
                Completed Memories
              </h4>
              <div className="grid gap-2">
                {completedMemories.map(item => (
                  <div 
                    key={item.memory.id} 
                    onClick={() => onSelectMemoryPlan?.(item.plan)}
                    className="p-4 bg-zinc-900/40 border border-white/[0.04] hover:border-[#FF6B2C]/20 rounded-2xl flex flex-col space-y-1 cursor-pointer transition-colors active:scale-[0.99] text-left"
                  >
                    <p className="text-xs font-semibold text-zinc-100">{item.title}</p>
                    <p className="text-[10px] font-mono text-emerald-450">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
