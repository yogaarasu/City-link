export type CitizenTextKey =
  | "dashboard"
  | "reportIssue"
  | "communityIssues"
  | "myProfile"
  | "settings"
  | "logout"
  | "darkMode";

const labels: Record<"en" | "ta", Record<CitizenTextKey, string>> = {
  en: {
    dashboard: "Dashboard",
    reportIssue: "Report Issue Now",
    communityIssues: "Community Issues",
    myProfile: "My Profile",
    settings: "Settings",
    logout: "Logout",
    darkMode: "Dark Mode",
  },
  ta: {
    dashboard: "முகப்பு",
    reportIssue: "புகார் அளி",
    communityIssues: "சமூக பிரச்சினைகள்",
    myProfile: "என் சுயவிவரம்",
    settings: "அமைப்புகள்",
    logout: "வெளியேறு",
    darkMode: "இருள் நிலை",
  },
};

export const getCitizenLabel = (language: "en" | "ta", key: CitizenTextKey) =>
  labels[language][key];
