export type CommunityListItem = {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt?: string;
  isMember?: boolean;
  memberCount?: number;
  eventCount?: number;
};

export type CommunityDetail = CommunityListItem & {
  isMember: boolean;
  memberCount: number;
  events?: Array<{
    _id: string;
    title: string;
    timestamp: string;
    rsvpCount?: number;
  }>;
};
