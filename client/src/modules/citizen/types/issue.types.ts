import type { IUser } from "@/types/user";

export type IssueStatus = "pending" | "in_progress" | "resolved" | "rejected";

export interface IssueStatusLog {
  status: IssueStatus;
  description: string;
  createdAt: string;
}

export interface IIssue {
  _id: string;
  title: string;
  category: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  district: string;
  photos: string[];
  status: IssueStatus;
  reportedBy: Pick<IUser, "_id" | "name" | "email" | "district" | "role" | "avatar">;
  upVotes: number;
  downVotes: number;
  statusLogs?: IssueStatusLog[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}
