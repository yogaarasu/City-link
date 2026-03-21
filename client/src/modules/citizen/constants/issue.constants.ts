import type { I18nKey } from "@/modules/i18n/config";
import type { IssueStatus } from "../types/issue.types";

export const ISSUE_CATEGORIES = [
  "Infrastructure (Potholes, Roads)",
  "Sanitation (Garbage, Debris)",
  "Utilities (Water, Power, Gas)",
  "Public Safety",
  "Parks & Recreation",
  "Other",
] as const;

export const ISSUE_STATUS = [
  "all",
  "pending",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
] as const;

export type I18nTranslator = (key: I18nKey, vars?: Record<string, string | number>) => string;

export const ISSUE_CATEGORY_LABEL_KEYS: Record<(typeof ISSUE_CATEGORIES)[number], I18nKey> = {
  "Infrastructure (Potholes, Roads)": "categoryInfrastructure",
  "Sanitation (Garbage, Debris)": "categorySanitation",
  "Utilities (Water, Power, Gas)": "categoryUtilities",
  "Public Safety": "categoryPublicSafety",
  "Parks & Recreation": "categoryParks",
  Other: "categoryOther",
};

export const ISSUE_STATUS_LABEL_KEYS: Record<IssueStatus, I18nKey> = {
  pending: "pending",
  verified: "verified",
  in_progress: "inProgress",
  resolved: "resolved",
  rejected: "rejected",
};

export const ISSUE_STATUS_FILTER_LABEL_KEYS: Record<(typeof ISSUE_STATUS)[number], I18nKey> = {
  all: "all",
  pending: "pending",
  verified: "verified",
  in_progress: "inProgress",
  resolved: "resolved",
  rejected: "rejected",
};

export const TAMIL_NADU_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupattur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
] as const;

export const DISTRICT_LABEL_KEYS: Record<(typeof TAMIL_NADU_DISTRICTS)[number], I18nKey> = {
  Ariyalur: "districtAriyalur",
  Chengalpattu: "districtChengalpattu",
  Chennai: "districtChennai",
  Coimbatore: "districtCoimbatore",
  Cuddalore: "districtCuddalore",
  Dharmapuri: "districtDharmapuri",
  Dindigul: "districtDindigul",
  Erode: "districtErode",
  Kallakurichi: "districtKallakurichi",
  Kanchipuram: "districtKanchipuram",
  Kanyakumari: "districtKanyakumari",
  Karur: "districtKarur",
  Krishnagiri: "districtKrishnagiri",
  Madurai: "districtMadurai",
  Mayiladuthurai: "districtMayiladuthurai",
  Nagapattinam: "districtNagapattinam",
  Namakkal: "districtNamakkal",
  Nilgiris: "districtNilgiris",
  Perambalur: "districtPerambalur",
  Pudukkottai: "districtPudukkottai",
  Ramanathapuram: "districtRamanathapuram",
  Ranipet: "districtRanipet",
  Salem: "districtSalem",
  Sivaganga: "districtSivaganga",
  Tenkasi: "districtTenkasi",
  Thanjavur: "districtThanjavur",
  Theni: "districtTheni",
  Thoothukudi: "districtThoothukudi",
  Tiruchirappalli: "districtTiruchirappalli",
  Tirunelveli: "districtTirunelveli",
  Tirupattur: "districtTirupattur",
  Tiruppur: "districtTiruppur",
  Tiruvallur: "districtTiruvallur",
  Tiruvannamalai: "districtTiruvannamalai",
  Tiruvarur: "districtTiruvarur",
  Vellore: "districtVellore",
  Viluppuram: "districtViluppuram",
  Virudhunagar: "districtVirudhunagar",
};

export const getCategoryLabel = (category: string, t?: I18nTranslator) => {
  const key = ISSUE_CATEGORY_LABEL_KEYS[category as (typeof ISSUE_CATEGORIES)[number]];
  if (!key || !t) return category;
  return t(key);
};

export const getStatusFilterLabel = (status: (typeof ISSUE_STATUS)[number], t?: I18nTranslator) => {
  if (!t) return status;
  return t(ISSUE_STATUS_FILTER_LABEL_KEYS[status]);
};

export const getDistrictLabel = (district: string, t?: I18nTranslator) => {
  const key = DISTRICT_LABEL_KEYS[district as (typeof TAMIL_NADU_DISTRICTS)[number]];
  if (!key || !t) return district;
  return t(key);
};

