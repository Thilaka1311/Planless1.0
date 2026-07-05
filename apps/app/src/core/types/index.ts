// Canonical schema aligning strictly with the user requested Planless database architecture
// Prefixed with Db for Relational Tables, with UI compatibility mappings for React views.

// ---------------------------------------------
// 7 CANONICAL DATABASE TABLES
// ---------------------------------------------

// 1. USERS TABLE
export interface User {
  id?: string;          // UUID primary key (users.id) — used for all FK relationships
  user_id: string;      // Sequential display identifier e.g. "U001" — display only, NOT a FK
  username: string;
  full_name: string;
  phone_number: string;
  password_hash?: string;
  profile_photo: string;
  bio: string;
  college_or_work: string;
  created_at: string; // ISO format
  wallet_balance: number;
  active_status: boolean;
}


// 2. CIRCLES TABLE
export interface DbCircle {
  id?: string; // UUID primary key
  circle_id: string;
  name: string;
  description: string;
  category: string;
  created_by: string; // user_id U001 etc.
  cover_image: string;
  location_anchor: string;
  privacy: "public" | "private";
  created_at: string;
}

// 3. CIRCLE_MEMBERS TABLE (Relationship table connecting users to circles)
export interface DbCircleMember {
  id?: string; // UUID primary key
  circle_member_id?: string;
  circle_id: string;
  user_id: string;
  role: "host" | "co_host" | "member";
  joined_at: string;
}

// 4. PLANS TABLE (The central focus object of everything in Planless)
export interface DbPlan {
  id: string;
  public_id: string;
  host_id: string;
  category: 'SPORTS' | 'MOVIES' | 'DINING' | 'ENTERTAINMENT' | 'TRAVEL' | 'FITNESS' | 'STUDY' | 'OTHER';
  subcategory: 'FOOTBALL' | 'BADMINTON' | 'CRICKET' | 'BASKETBALL' | 'VOLLEYBALL' | 'TENNIS' | 'PICKLEBALL' | 'BOWLING' | 'GO_KARTING' | 'MOVIE' | 'RESTAURANT' | 'CAFE' | 'ROAD_TRIP' | 'GYM' | 'STUDY_SESSION' | 'OTHER';
  title: string;
  description: string;
  place_id: string;
  place_name: string;
  place_address: string;
  scheduled_at: string;
  rsvp_deadline: string;
  max_participants: number | null;
  total_cost: number;
  status: 'LIVE' | 'COMPLETED' | 'CANCELLED';
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
}

// 5. PLAN_PARTICIPANTS TABLE (Attendance & payment status)
export interface DbPlanParticipant {
  id: string;
  plan_id: string;
  user_id: string;
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
  rsvp_status: 'INVITED' | 'JOINED' | 'SKIPPED' | 'WAITLISTED';
  delivery_status?: 'DELIVERED' | 'SEEN';
  skip_reason?: 'LEFT' | 'REMOVED' | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

// 6. TRANSACTIONS TABLE (Handles spontaneous social splits/obligations)
export interface DbTransaction {
  id?: string; // UUID primary key
  transaction_id: string;
  sender_id: string | null; // UUID → users.id (or special values: "SYSTEM", "UPI", null)
  receiver_id: string | null; // UUID → users.id (or special values: "SYSTEM", null)
  plan_id: string | null;
  amount: number;
  transaction_type: string; // "split_payment" | "deposit" | "settlement"
  status: "success" | "pending" | "failed";
  timestamp: string;
}

// 7. PLAN MEMORY INFO (Derived from plans + plan_participants — replaces DbMemory/DbMemoryAttendee)
export interface PlanMemoryInfo {
  planId: string;           // plan.dbUuid || plan.id
  memoryType: string;       // derived from category/activity_type
  editableUntil: string;    // far future (Option A for MVP)
  completedAt: string;
  attendeeUserIds: string[]; // plan_participants filtered to status === "going"
}

export interface DbPlanOutcome {
  id?: string;
  plan_id: string;
  submitted_by_user_id: string;
  outcome_type: string;
  payload: any;
  created_at?: string;
}

export interface DbMemory {
  id?: string;
  plan_id: string;
  memory_type: 'football' | 'badminton' | 'movies' | 'dining';
  status: string;
  created_at?: string;
  locked_at?: string | null;
  editable_until: string;
}

export interface DbMemoryResult {
  id?: string;
  memory_id: string;
  score_home?: number | null;
  score_away?: number | null;
  mvp_user_id?: string | null;
  average_rating?: number | null;
  review?: string | null;
  created_at?: string;
}

export interface DbFriendship {
  id?: string; // UUID primary key
  user_1_id: string; // UUID -> users.id (lexicographically smaller)
  user_2_id: string; // UUID -> users.id (lexicographically larger)
  requested_by: string; // UUID -> users.id (who sent the request)
  created_from_plan_id?: string | null; // UUID -> plans.id
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at?: string;
  responded_at?: string | null;
}

// 8. PLAN_TEAM_ASSIGNMENTS TABLE (Football Team Organizer)
export interface DbPlanTeamAssignment {
  id?: string;       // UUID primary key
  plan_id: string;   // UUID → plans.id
  user_id: string;   // UUID → users.id
  team: "A" | "B";
  created_at?: string;
}

// ---------------------------------------------
// COMPATIBLE FRONTEND INTERACTIVES VIEW MODELS
// ---------------------------------------------

export type PlanState = "going" | "passed" | "waitlist" | "unanswered" | "delivered" | "seen" | "skipped";

export interface PlanMember {
  userId: string;
  userUuid?: string;
  name: string;
  avatar: string;
  isHydrating?: boolean;
  joinState: PlanState;
  reminderState: "sent" | "none";
  joinedAt: string;
  waitlistedAt?: string;
  seenAt?: string;
  skippedAt?: string;
  deliveredAt?: string;
  updatedAt?: string;
  createdAt?: string;
  checkedIn?: boolean;
}

// Backward compatibility alias for UI
export type JoinedUser = PlanMember;

export interface Plan {
  // Strict Backend Contracts
  id: string;
  dbUuid?: string;
  publicId?: string;
  title: string;
  groupId: string | null;
  hostId: string;
  members: PlanMember[];
  capacity?: number;
  date: string;
  time: string;
  location: string;
  paymentAmount: number;
  status: "LIVE" | "COMPLETED" | "CANCELLED" | "PENDING" | "BOOKING_READY" | "CONFIRMED" | "SLOT_UNAVAILABLE";
  datetime?: string;
  createdAt: string;
  waitlistEnabled?: boolean;
  joinLimit?: number;

  // UI Legacy Properties (Synced with Strict Contracts)
  category: "movies" | "sports" | "restaurants" | "custom";
  cost: number;
  confirmedCount: number;
  maxSpots?: number;
  coverImage: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  joinedUsers: JoinedUser[];
  timeline: "today" | "tomorrow" | "weekend";
  description?: string;
  theatre?: string;
  seatsLeft?: number;
  notes?: string;
  coordinatedSeat?: string;
  userRating?: number;
  userReaction?: string;
  isHappened?: boolean;
  isActive?: boolean;
  reminderNotificationSent?: boolean;
  circleId?: string | null;
  circleName?: string | null;
  isCircleHydrating?: boolean;
  response_cutoff_hours?: number;
  response_deadline_at?: string;

  // Sports Plan fields
  sports_type?: "Football" | "Badminton" | "Basketball";
  venue_id?: string;
  venue_cost?: number;
  required_confirmations?: number;
  slot_label?: string;
  skillLevel?: string;
  matchFormat?: string;
  waitlistUsers?: JoinedUser[];
  enteredScore?: string;
  votedMvp?: string;
  mvpVotes?: { name: string; votes: number }[];
  attendanceLogged?: boolean;

  // Restaurant Plan fields
  cuisineType?: string;
  tableAvailability?: string;
  estimatedCost?: string;
  interestedUsers?: JoinedUser[];
  foodReaction?: string;
}

export interface Circle {
  id: string;
  dbUuid?: string;
  name: string;
  membersCount: number;
  avatars: string[];
  groupImage?: string;
  lastSpontaneousActivity: string;
  description: string;
  type: string;
  location: string;
  format: string;
  playersOnField: number;
  timeWindow: string;
  membersList: {
    name: string;
    phone: string;
    avatar: string;
  }[];
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "credit" | "debit";
  timestamp: string;
  settled: boolean;
  status?: string;
  transactionType?: string;
  planTitle?: string | null;
}

export interface NotificationItem {
  id: string;
  type: "PLAN_INVITATION" | "WAITLIST_PROMOTED" | "PLAN_CANCELLED" | "PLAN_UPDATED" | "HOST_TRANSFERRED" | "PARTICIPANT_JOINED" | "PARTICIPANT_SKIPPED" | "invitation" | "urgency" | "payment" | "general" | string;
  title: string;
  body?: string;
  relativeTime: string;
  actionText?: string;
  planId?: string;
  settled?: boolean;
  cost?: number;
  creatorId?: string;
  createdAt?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  bio: string;
  avatar: string;
  joined: boolean;
  college_or_work?: string;
  user_id?: string;
  dbUuid?: string;
  token?: string;
  profile_completed?: boolean;
}

export type ActivityType = "Football" | "Badminton" | "Movie" | "Dinner" | "Cafe" | "Pub" | "Sports" | "Movies" | "Dining";

export interface ActivityTimeSlot {
  label: string;
  iso: string;
  locked?: boolean;
}

export interface ActivityVenue {
  id: string;
  name: string;
  costPerPerson: number;
  timeSlots: ActivityTimeSlot[];
  tags: string[];
  distance: string;
  image: string;
  venue_cost: number;
}

export interface ChatMessage {
  id: string;
  circleId: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

