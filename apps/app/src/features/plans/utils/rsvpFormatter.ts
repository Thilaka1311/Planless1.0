import { useState, useEffect } from 'react';

export interface RSVPDeadlineInfo {
  text: string;
  color: string;
  state: 'expired' | 'urgent' | 'today' | 'tomorrow' | 'future';
}

export function getRSVPDeadlineInfo(deadlineStr: string | null | undefined, now: Date = new Date()): RSVPDeadlineInfo {
  if (!deadlineStr) {
    return { text: 'No deadline', color: 'rgba(255, 255, 255, 0.4)', state: 'expired' };
  }

  try {
    const deadline = new Date(deadlineStr);
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { text: 'RSVP Closed', color: 'rgba(255, 255, 255, 0.4)', state: 'expired' };
    }

    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);

    const formatTime = (d: Date) => {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    };

    const formatWeekday = (d: Date) => {
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDeadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const diffDays = Math.round((startOfDeadline.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Less than 1 hour remaining
    if (diffMinutes < 60) {
      const mins = Math.max(1, Math.floor(diffMinutes));
      return { text: `${mins}m left`, color: '#EF4444', state: 'urgent' };
    }

    // 2. Less than 24 hours remaining
    // If it's today and more than 12 hours remaining, we show "Today • time" (Orange) as per "Today" display rules.
    // If it's less than 12 hours or tomorrow but less than 24 hours remaining, we show countdown (Red).
    if (diffHours < 24) {
      if (diffDays === 0 && diffHours >= 12) {
        return { text: `Today • ${formatTime(deadline)}`, color: '#F97316', state: 'today' };
      }
      const hrs = Math.floor(diffHours);
      return { text: `${hrs}h left`, color: '#EF4444', state: 'urgent' };
    }

    // 3. Today (calendar day is today, but diffHours >= 24 - impossible, but handle just in case)
    if (diffDays === 0) {
      return { text: `Today • ${formatTime(deadline)}`, color: '#F97316', state: 'today' };
    }

    // 4. Tomorrow (calendar day is tomorrow)
    if (diffDays === 1) {
      return { text: `Tomorrow • ${formatTime(deadline)}`, color: '#F59E0B', state: 'tomorrow' };
    }

    // 5. Between 2 and 7 days remaining
    if (diffDays >= 2 && diffDays <= 7) {
      return { text: `${formatWeekday(deadline)} • ${formatTime(deadline)}`, color: '#22C55E', state: 'future' };
    }

    // 6. More than 7 days remaining
    return { text: `${formatDate(deadline)} • ${formatTime(deadline)}`, color: '#22C55E', state: 'future' };

  } catch {
    return { text: deadlineStr, color: 'rgba(255, 255, 255, 0.4)', state: 'expired' };
  }
}

export function useRSVPDeadline(deadlineStr: string | null | undefined): RSVPDeadlineInfo {
  const [info, setInfo] = useState<RSVPDeadlineInfo>(() => getRSVPDeadlineInfo(deadlineStr));

  useEffect(() => {
    setInfo(getRSVPDeadlineInfo(deadlineStr));

    const getUpdateInterval = () => {
      if (!deadlineStr) return 60000;
      const diffMs = new Date(deadlineStr).getTime() - Date.now();
      if (diffMs <= 0) return 60000;
      if (diffMs < 1000 * 60 * 60) return 10000; // 10s
      if (diffMs < 1000 * 60 * 60 * 24) return 30000; // 30s
      return 60000; // 60s
    };

    let intervalId = setInterval(() => {
      setInfo(getRSVPDeadlineInfo(deadlineStr));
    }, getUpdateInterval());

    const checkerId = setInterval(() => {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        setInfo(getRSVPDeadlineInfo(deadlineStr));
      }, getUpdateInterval());
    }, 60000);

    return () => {
      clearInterval(intervalId);
      clearInterval(checkerId);
    };
  }, [deadlineStr]);

  return info;
}
