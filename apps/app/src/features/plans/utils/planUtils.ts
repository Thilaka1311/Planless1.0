import { User } from "../../../core/types";

export const cleanPlanId = (id: string): string =>
  id.replace("-loop-prev-dup", "").replace("-loop-next-dup", "");

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (val: any): boolean =>
  typeof val === "string" && uuidRegex.test(val);

export function resolveUserUuid(uId: string, dbUsers: User[]): string {
  const userObj = dbUsers.find(u => u.user_id === uId || u.id === uId);
  return userObj ? (userObj.id || uId) : uId;
}
