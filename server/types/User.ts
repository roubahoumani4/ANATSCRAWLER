export interface User {
  _id: string;
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
  roles?: string[];
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isActive?: boolean;
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    autoLogoutTime?: number;
    mfaEnabled?: boolean;
    showIndexedFiles?: boolean;
    showRecentSearches?: boolean;
  };
}
