export enum UserRole {
  Admin = 1,
  Manager = 2,
  User = 3,
  Staff = 4,
}

export enum AccountStatus {
  Active = 1,
  PendingEmailVerification = 2,
  PendingIdentityVerification = 3,
  Suspended = 4,
  Banned = 5,
}

export interface ManagerUserListItem {
  id: string;
  name: string;
  email: string;
  imgUrl: string | null;
  role: UserRole;
  status: AccountStatus;
  statusReason: string | null;
  emailVerified: boolean;
  studentId: string | null;
  majorOrClass: string | null;
  phoneNumber: string | null;
  balanceAmount: number;
  lastLoginAt: string | null;
  createdAtUtc: string;
}

export interface ManagerUserDetail extends ManagerUserListItem {
  dateOfBirth: string | null;
  address: string | null;
  gender: number | null;
  updatedAtUtc: string | null;
}

export interface ManagerUserFilters {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: AccountStatus;
  role?: UserRole;
}

export interface ManagerUserStatusResult {
  userId: string;
  status: AccountStatus;
  revokedRefreshTokenCount?: number;
  reason?: string;
  message: string;
}
