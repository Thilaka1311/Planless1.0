import { Plan } from "../../../core/types";
import { parseTimeToMinutes } from "../../../../lib/participantStatus";

// Re-export parseTimeToMinutes to satisfy the requirement of moving/exporting all three helpers from here
export { parseTimeToMinutes };

export const getTimelineSectionValue = (p: Plan) => {
  const dt = p.date.toUpperCase();
  if (dt.includes("TODAY")) return 1;
  if (dt.includes("TOMORROW")) return 2;
  return 3;
};

export const getDayIndexValue = (dateStr: string) => {
  const d = dateStr.toUpperCase();
  if (d.includes("MON")) return 1;
  if (d.includes("TUE")) return 2;
  if (d.includes("WED")) return 3;
  if (d.includes("THU")) return 4;
  if (d.includes("FRI")) return 5;
  if (d.includes("SAT")) return 6;
  if (d.includes("SUN")) return 7;
  return 8;
};
