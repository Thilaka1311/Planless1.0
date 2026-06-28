/**
 * Normalizes two user UUIDs lexicographically to guarantee canonical order in the database.
 * The smaller UUID is user_1_id, and the larger UUID is user_2_id.
 */
export function normalizeFriendshipUsers(uuidA: string, uuidB: string) {
  return uuidA < uuidB
    ? { user_1_id: uuidA, user_2_id: uuidB }
    : { user_1_id: uuidB, user_2_id: uuidA };
}
