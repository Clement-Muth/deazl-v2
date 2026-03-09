export interface HouseholdMember {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

export interface Household {
  id: string;
  inviteCode: string;
  createdBy: string;
  members: HouseholdMember[];
}
