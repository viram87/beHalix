export type EventImage = {
  url: string;
  publicId: string;
  uploadedAt: string;
};

export type EventAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
};

export type EventListItem = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  timestamp: string;
  isWomenOnly: boolean;
  address: EventAddress;
  images: EventImage[];
  rsvpCount: number;
  userHasRsvped?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** From backend: event created within last 14 days */
  isNewlyAdded?: boolean;
  /** From backend: current user has saved this event */
  userHasSaved?: boolean;
  /** First few RSVPs for "who's going" avatars on list/cards */
  attendeePreview?: { displayName: string; avatarId: number }[];
};

export type EventCreator = {
  id: string;
  displayName: string;
  avatarId: number;
};

export type EventDetail = EventListItem & {
  rsvpCount: number;
  userHasRsvped?: boolean;
  createdBy?: string;
  creator?: EventCreator | null;
  tags?: string[];
  assemblyTime?: string;
};

export type EventAttendee = {
  userId: string;
  email?: string;
  displayName?: string;
  avatarId?: number;
  gender?: string;
  interests?: string[];
  phone?: string;
  rsvpedAt: string;
  isHost?: boolean;
};

export type AttendeePreviewItem = {
  userId: string;
  displayName: string;
  avatarId: number;
  isHost: boolean;
};

export type UserRsvpItem = {
  rsvpId: string;
  event: {
    id: string;
    title: string;
    timestamp: string;
    address: { city: string; state: string };
  };
  rsvpedAt: string;
};

export type EventsResponse = {
  events: EventListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EventReactionType = 'excited' | 'interested' | 'skeptical' | 'not_for_me';

export type EventReactionCounts = Record<EventReactionType, number>;

export type CommentReply = {
  id: string;
  text: string;
  userId: string;
  displayName: string;
  avatarId: number;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: 'like' | 'dislike' | null;
  canEdit: boolean;
  canDelete?: boolean;
};

export type EventCommentItem = {
  id: string;
  text: string;
  userId: string;
  displayName: string;
  avatarId: number;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: 'like' | 'dislike' | null;
  replies: CommentReply[];
  canEdit: boolean;
  canDelete?: boolean;
};
