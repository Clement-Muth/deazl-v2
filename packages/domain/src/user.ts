export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}
