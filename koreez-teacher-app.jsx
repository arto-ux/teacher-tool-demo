import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import TeachersRoomPage from "./TeachersRoomPage.jsx";
import { KOREEZ_FONT_FAMILY, getKoreezAntdFontTokens, TYPO, typoStyle, typoStrong, typoPageHeading } from "./typography-tokens.js";
import { Drawer, Tabs, Table, Tag, Button, Modal, Space, message, Avatar, Dropdown, ConfigProvider, Collapse } from "antd";
import {
  HomeOutlined,
  HomeFilled,
  CheckSquareOutlined,
  QuestionCircleOutlined,
  MailOutlined,
  TrophyOutlined,
  QrcodeOutlined,
  RightOutlined,
  CheckOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  CopyOutlined,
  DollarOutlined,
  MoreOutlined,
  UserOutlined,
  DeleteOutlined,
  UserAddOutlined,
  GiftOutlined,
  CommentOutlined,
  PlusOutlined,
  SendOutlined,
  DownloadOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  LockOutlined,
} from "@ant-design/icons";

const TEACHER_AVATAR_SRC = "/assets/images/Rectavatar_teacher.jpg";

function koreezLogoSrc() {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}assets/images/koreez_logo.svg`;
}

function qrCodeImageSrc() {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}assets/images/qr-code.png`;
}

function koreezCoolSvgSrc() {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}assets/images/koreez_cool.svg`;
}

function tierMedalAssetUrl(filename) {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}assets/images/${filename}`;
}

/** Cycles `01_teacher.png` … `10_teacher.png` from `/assets/images/`; you keep the profile photo. */
function leaderboardAvatarSrc(rank, isYou) {
  if (isYou) return TEACHER_AVATAR_SRC;
  const i = ((rank - 1) % 10) + 1;
  return `/assets/images/${String(i).padStart(2, "0")}_teacher.png`;
}

// ── DATA ──
const TEACHER = {
  id: "staff-gayane",
  name: "Gayane Asatryan",
  score: 88.9,
  rank: 7,
  schoolRank: 3,
  tier: "gold",
  avgGrade: 81,
  weeklyDone: 3,
  weeklyTotal: 5,
  percentile: 82,
  /** Mock: successful teacher invites (Community builder at 10+). */
  teachersInvitedCount: 6,
};

const TEACHER_PROGRESS_MOCK = {
  consecutiveCertificationMonths: 6,
  eligibleStudentsThisMonth: { bestStudent: 2, activeParticipation: 5, participation: 11, premiumEligible: 14 },
  studentsByMedal: { free: 27, bronze: 6, silver: 6, gold: 4 },
  monthlyAssignedTasks: 24,
  weeklyAssignedTasks: 6,
  invitesConvertedToPremium: TEACHER.teachersInvitedCount,
  /** Free yearly activation slots used (0–3) after milestone; mock only. */
  freeYearlySpotsUsed: 0,
  /** Year-end spotlight (mock). Separate from weekly leaderboard score on board view. */
  teacherOfYearSeasonLabel: "2025–2026",
  teacherOfYearPoints: 23_408,
  teacherOfYearRankingLine: "Ranking in Top 10%",
  /** 0–1 fill for bar + avatar marker */
  teacherOfYearBarProgress: 0.88,
};

/** Shared copy: achievement rules drawer + detail modals + TOTY drawer */
const PROGRESSION_RULES_TEACHER_MEDALS_PARAGRAPH = (
  <>
    You earn <strong>Bronze</strong> when at least <strong>5</strong> of your students hold a bronze medal, <strong>Silver</strong> at{" "}
    <strong>10</strong> silver students, and <strong>Gold</strong> at <strong>20</strong> gold students.
  </>
);

const PROGRESSION_RULES_AMBASSADOR_PARAGRAPH = (
  <>
    Unlocks when <strong>20 students</strong> have an active <strong>Premium</strong> subscription through <strong>your invitation</strong> (invite link or code attributed to you).
  </>
);

const PROGRESSION_RULES_TEACHER_OF_YEAR_PARAGRAPH = (
  <>
    You don&apos;t need the <strong>gold teacher medal</strong> to appear on this leaderboard—your standing comes from <strong>achievement points</strong> when students complete assigned work. The <strong>top 10</strong> teachers are invited to the{" "}
    <strong>Koreez Awards Ceremony</strong> to receive <strong>prizes and trophies on stage</strong>.
  </>
);

/** Points per completed task by student category (Achievement rules drawer). */
const PROGRESSION_RULES_TEACHER_POINTS_CONTENT = (
  <>
    <p style={{ margin: "0 0 10px" }}>
      Each time a student completes an assigned task, you earn teacher points. The amount depends on that student&apos;s category:
    </p>
    <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.65 }}>
      <li style={{ marginBottom: 6 }}>
        <strong>2 points</strong> — Free students
      </li>
      <li style={{ marginBottom: 6 }}>
        <strong>3 points</strong> — Students holding at least a Certificate of Participation
      </li>
      <li style={{ marginBottom: 6 }}>
        <strong>5 points</strong> — Bronze student medalists
      </li>
      <li style={{ marginBottom: 6 }}>
        <strong>7 points</strong> — Silver student medalists
      </li>
      <li style={{ marginBottom: 0 }}>
        <strong>10 points</strong> — Gold student medalists
      </li>
    </ul>
  </>
);

/** Short copy for the Teacher of the Year drawer only (rules drawer keeps full paragraphs). */
const TEACHER_OF_YEAR_DRAWER_INTRO = (
  <>
    Keep your classes active and climb this year-end leaderboard—every bit of momentum counts. The <strong>top 10</strong> teachers are invited to the{" "}
    <strong>Koreez Awards Ceremony</strong>, where you&apos;ll receive your <strong>prizes and trophies on stage</strong>.
  </>
);

/** Shown on the My school leaderboard */
const MY_SCHOOL_NAME = "Hayk Yeghazyan Educational Complex";

/** Year-end achievement-points ranking (mock). Uses {@link MY_SCHOOL_NAME}. */
const TEACHER_OF_YEAR_LEADERBOARD = [
  { rank: 1, name: "Tigran Arakelyan", school: "Ayb School", points: 28_940 },
  { rank: 2, name: "Nare Hakobyan", school: "Quantum College", points: 27_812 },
  { rank: 3, name: "Anahit Baghdasaryan", school: "Yerevan Physics School", points: 26_105 },
  { rank: 4, name: "Gor Mkrtchyan", school: "Mkhitar Sebastatsi Educomplex", points: 25_480 },
  { rank: 5, name: "Lilit Karapetyan", school: "Pushkin Secondary School", points: 24_902 },
  { rank: 6, name: "Arayik Sargsyan", school: "School #132", points: 24_110 },
  { rank: 7, name: "Gayane Asatryan", school: MY_SCHOOL_NAME, points: 23_408, isYou: true },
  { rank: 8, name: "Hasmik Ter-Hovakimyan", school: "Dilijan Central School", points: 22_891 },
  { rank: 9, name: "Gohar Vardanyan", school: "Ayb School", points: 22_004 },
  { rank: 10, name: "Karen Manukyan", school: "Tumo Labs Partner School", points: 21_550 },
  { rank: 11, name: "Syuzanna Lusikyan", school: "Waldorf Yerevan", points: 20_980 },
  { rank: 12, name: "Armen Avetisyan", school: "Khachatur Abovyan School", points: 20_100 },
];

/** Same school only — school-local ranks (Gayane is #3 here; global rank stays in TEACHER.rank). */
const SCHOOL_LEADERBOARD_ROWS = [
  { rank: 1, name: "Tigran Arakelyan", score: 94.2, tier: "gold" },
  { rank: 2, name: "Nare Hakobyan", score: 93.8, tier: "gold" },
  { rank: 3, name: "Gayane Asatryan", score: 88.9, tier: "gold", isYou: true },
  { rank: 4, name: "Lilit Karapetyan", score: 84.0, tier: "silver" },
  { rank: 5, name: "Gor Mkrtchyan", score: 81.2, tier: "silver" },
  { rank: 6, name: "Anahit Baghdasaryan", score: 79.4, tier: "silver" },
  { rank: 7, name: "Elen Avetisyan", score: 77.1, tier: "silver" },
  { rank: 8, name: "Vardan Bejanian", score: 72.8, tier: "bronze" },
  { rank: 9, name: "Mane Grigoryan", score: 70.2, tier: "bronze" },
  { rank: 10, name: "Yana Avetisyan", score: 67.5, tier: "bronze" },
];

const CLASSES = [
  { id: "8a", name: "Mathematics", section: "8-A", students: 15 },
  { id: "8b", name: "Mathematics", section: "8-B", students: 15 },
  { id: "9a", name: "Mathematics", section: "9-A", students: 18 },
  { id: "9b", name: "Mathematics", section: "9-B", students: 14 },
  { id: "10a", name: "Mathematics", section: "10-A", students: 12 },
];

function classLabel(cls) {
  return `${cls.name} · ${cls.section}`;
}

/** Mock roster — replace with API. Files in `public/assets/images/` → served as `/assets/images/01_student.png` … (and copied to `dist/assets/images/` on build). */
function studentAvatarSrc(studentId) {
  let h = 0;
  for (let i = 0; i < studentId.length; i++) h += studentId.charCodeAt(i);
  const n = (h % 10) + 1;
  const file = `${String(n).padStart(2, "0")}_student.png`;
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}assets/images/${file}`;
}

function sortStudentsByLastName(a, b) {
  const last = (full) => {
    const p = full.trim().split(/\s+/).filter(Boolean);
    return (p.length ? p[p.length - 1] : full).toLowerCase();
  };
  const c = last(a.name).localeCompare(last(b.name), undefined, { sensitivity: "base" });
  if (c !== 0) return c;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/** Five `assets/images/*_student.png` URLs for class cards: roster first, then deterministic fillers. */
function classCardStudentPreviewSrcs(classId) {
  const roster = STUDENTS_INITIAL.filter((s) => s.classId === classId).slice().sort(sortStudentsByLastName);
  const srcs = roster.slice(0, 5).map((s) => studentAvatarSrc(s.id));
  for (let i = srcs.length; i < 5; i++) {
    srcs.push(studentAvatarSrc(`card-${classId}-fill-${i}`));
  }
  return srcs;
}

/** "Anna Minasyan" → "Minasyan Anna"; "Lusine Ter-Minasyan" → "Ter-Minasyan Lusine". */
function displayNameLastFirst(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return fullName;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(" ");
  return `${last} ${rest}`;
}

function premiumActiveTillOneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Product: replace host + sign discount tokens server-side. Yearly plan only for TEACHER50. */
const PREMIUM_YEARLY_DISCOUNT_BASE = "https://koreez.app/premium";

function buildBulkYearlyDiscountUrl({ allRoster, classId }) {
  const u = new URL(PREMIUM_YEARLY_DISCOUNT_BASE);
  u.searchParams.set("plan", "yearly");
  u.searchParams.set("discount", "TEACHER50");
  if (allRoster) u.searchParams.set("scope", "all");
  else if (classId) u.searchParams.set("class", classId);
  return u.toString();
}

const STUDENTS_INITIAL = [
  { id: "stu-8a-01", name: "Anna Minasyan", classId: "8a", isPremium: true, activeTill: "2025-09-14" },
  { id: "stu-8a-02", name: "Davit Karapetyan", classId: "8a", isPremium: false },
  { id: "stu-8a-03", name: "Mariam Sargsyan", classId: "8a", isPremium: false },
  { id: "stu-8a-04", name: "Erik Babayan", classId: "8a", isPremium: false },
  { id: "stu-8b-01", name: "Lusine Ter-Minasyan", classId: "8b", isPremium: false },
  { id: "stu-8b-02", name: "Gor Avetisyan", classId: "8b", isPremium: true, activeTill: "2025-11-02" },
  { id: "stu-8b-03", name: "Nare Petrosyan", classId: "8b", isPremium: false },
  { id: "stu-9a-01", name: "Hayk Vardanyan", classId: "9a", isPremium: false },
  { id: "stu-9a-02", name: "Sona Lusikyan", classId: "9a", isPremium: false },
  { id: "stu-9a-03", name: "Arman Zakaryan", classId: "9a", isPremium: false },
  { id: "stu-9a-04", name: "Tatevik Hakobyan", classId: "9a", isPremium: true, activeTill: "2026-01-18" },
  { id: "stu-9a-05", name: "Karen Davtyan", classId: "9a", isPremium: false },
  { id: "stu-9b-01", name: "Ani Grigoryan", classId: "9b", isPremium: false },
  { id: "stu-9b-02", name: "Vardan Rostomyan", classId: "9b", isPremium: false },
  { id: "stu-9b-03", name: "Elen Yesayan", classId: "9b", isPremium: false },
  { id: "stu-10a-01", name: "Mikayel Chilingaryan", classId: "10a", isPremium: false },
  { id: "stu-10a-02", name: "Yana Avetisyan", classId: "10a", isPremium: false },
  { id: "stu-10a-03", name: "Ruben Nazaryan", classId: "10a", isPremium: false },
];

/** Gold tier — ranks 1–12 (12 teachers) */
const LEADERBOARD_TOP = [
  { rank: 1, name: "Tigran Arakelyan", score: 94.2, tier: "gold", school: "Ayb School" },
  { rank: 2, name: "Nare Hakobyan", score: 93.8, tier: "gold", school: "Quantum College" },
  { rank: 3, name: "Anahit Baghdasaryan", score: 92.1, tier: "gold", school: "Yerevan Physics School" },
  { rank: 4, name: "Gor Mkrtchyan", score: 91.5, tier: "gold", school: "Mkhitar Sebastatsi Educomplex" },
  { rank: 5, name: "Lilit Karapetyan", score: 90.7, tier: "gold", school: "Pushkin Secondary School" },
  { rank: 6, name: "Arayik Sargsyan", score: 89.9, tier: "gold", school: "School #132" },
  { rank: 7, name: "Gayane Asatryan", score: 88.9, tier: "gold", isYou: true, school: MY_SCHOOL_NAME },
  { rank: 8, name: "Hasmik Ter-Hovakimyan", score: 88.1, tier: "gold", school: "Dilijan Central School" },
  { rank: 9, name: "Gohar Vardanyan", score: 87.4, tier: "gold", school: "Ayb School" },
  { rank: 10, name: "Karen Manukyan", score: 86.7, tier: "gold", school: "Tumo Labs Partner School" },
  { rank: 11, name: "Syuzanna Lusikyan", score: 86.0, tier: "gold", school: "Waldorf Yerevan" },
  { rank: 12, name: "Armen Avetisyan", score: 85.3, tier: "gold", school: "Khachatur Abovyan School" },
];

/** Silver (ranks 13–30) and bronze (ranks 31–35) */
const NEARBY = [
  { rank: 13, name: "Ruben Davtyan", score: 84.2, tier: "silver", school: MY_SCHOOL_NAME },
  { rank: 14, name: "Elen Avetisyan", score: 83.8, tier: "silver", school: MY_SCHOOL_NAME },
  { rank: 15, name: "Vardan Bejanian", score: 83.4, tier: "silver", school: MY_SCHOOL_NAME },
  { rank: 16, name: "Mariam Khachatryan", score: 83.0, tier: "silver", school: "Yerevan Physics School" },
  { rank: 17, name: "David Minasyan", score: 82.6, tier: "silver", school: "Ayb School" },
  { rank: 18, name: "Ani Rostomyan", score: 82.2, tier: "silver", school: "Quantum College" },
  { rank: 19, name: "Hayk Petrosyan", score: 81.8, tier: "silver", school: "School #189" },
  { rank: 20, name: "Sona Ter-Minasyan", score: 81.4, tier: "silver", school: "Pushkin Secondary School" },
  { rank: 21, name: "Narek Vardanyan", score: 81.0, tier: "silver", school: "Mkhitar Sebastatsi Educomplex" },
  { rank: 22, name: "Gayane Sargsyan", score: 80.6, tier: "silver", school: "Dilijan Central School" },
  { rank: 23, name: "Tatevik Stepanyan", score: 80.2, tier: "silver", school: "Khachatur Abovyan School" },
  { rank: 24, name: "Gevorg Margaryan", score: 79.8, tier: "silver", school: "Waldorf Yerevan" },
  { rank: 25, name: "Lusine Vardanyan", score: 79.4, tier: "silver", school: "Tumo Labs Partner School" },
  { rank: 26, name: "Armen Karapetyan", score: 79.0, tier: "silver", school: "School #132" },
  { rank: 27, name: "Siranush Hakobyan", score: 78.6, tier: "silver", school: "Ayb School" },
  { rank: 28, name: "Karen Ter-Minasyan", score: 78.2, tier: "silver", school: "Yerevan Physics School" },
  { rank: 29, name: "Astghik Lusikyan", score: 77.8, tier: "silver", school: "Quantum College" },
  { rank: 30, name: "Liana Petrosyan", score: 77.4, tier: "silver", school: "Pushkin Secondary School" },
  { rank: 31, name: "Mane Grigoryan", score: 72.0, tier: "bronze", school: MY_SCHOOL_NAME },
  { rank: 32, name: "Artur Zakaryan", score: 70.5, tier: "bronze", school: "School #189" },
  { rank: 33, name: "Nelli Petrosyan", score: 69.0, tier: "bronze", school: "Mkhitar Sebastatsi Educomplex" },
  { rank: 34, name: "Edgar Yesayan", score: 67.5, tier: "bronze", school: "Dilijan Central School" },
  { rank: 35, name: "Hasmik Rostomyan", score: 66.0, tier: "bronze", school: "Khachatur Abovyan School" },
];

const TIER_CONFIG = {
  gold: { color: "#C5960C", bg: "#FDF8E8", border: "#E8D48A", medalFile: "gold-medal.svg", label: "Gold" },
  silver: { color: "#6B7B8D", bg: "#EDF1F5", border: "#C5CED6", medalFile: "bronze-medal.svg", label: "Silver" },
  bronze: { color: "#9A6B3A", bg: "#F9F2EB", border: "#D4B896", medalFile: "bronze-medal-1.svg", label: "Bronze" },
};

/** Tier medal artwork (`public/assets/images/*-medal*.svg`). Natural size 48×60; `height` scales width proportionally. */
function TierMedalImage({ tier, height = 48, style, alt = "" }) {
  const file = TIER_CONFIG[tier]?.medalFile;
  if (!file) return null;
  return (
    <img
      src={tierMedalAssetUrl(file)}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      width={48}
      height={60}
      style={{
        height,
        width: "auto",
        display: "block",
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/** Shown under each tier heading on the leaderboard tab */
const LEADERBOARD_TIER_DESCRIPTIONS = {
  gold: "Top 10% of teachers by weekly rank. Highest tier — eligible for a Certificate of Excellence at year end.",
  silver: "Upper tier — roughly the next 30% after Gold. Certificate of Achievement eligibility.",
  bronze: "The broadest band — building your score and consistency. Certificate of Participation at year end.",
};

const LEADERBOARD_TIER_ORDER = ["gold", "silver", "bronze"];

function groupLeaderboardByTier(rows) {
  const map = { gold: [], silver: [], bronze: [] };
  for (const row of rows) {
    const bucket = map[row.tier];
    if (bucket) bucket.push(row);
  }
  for (const key of LEADERBOARD_TIER_ORDER) {
    map[key].sort((a, b) => a.rank - b.rank);
  }
  return map;
}

const NAV_ITEMS = [
  { key: "home", Icon: HomeOutlined, label: "Home" },
  { key: "students", Icon: TeamOutlined, label: "My Students" },
  { key: "teachersRoom", Icon: CommentOutlined, label: "Teachers Room" },
  { key: "assign", Icon: CheckSquareOutlined, label: "Assignments" },
  { key: "help", Icon: QuestionCircleOutlined, label: "Help" },
  { key: "messages", Icon: MailOutlined, label: "Feedback" },
];

const NAV_ITEMS_2 = [
  { key: "comp", Icon: TrophyOutlined, label: "Competitions" },
  { key: "events", Icon: QrcodeOutlined, label: "Sent Invitations" },
];

const navIconStyle = { ...typoStyle("large"), width: 20, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 };

// ── STYLES ──
const colors = {
  blue: "#2990FF", deepBlue: "#0076BA", lime: "#9AE600", red: "#EE220D",
  ink: "#1A1A2E", text: "#3D3D3D", muted: "#808080", lightGray: "#A7A7A7",
  bg: "#F5F7FA", border: "#E8ECF0", card: "#FFFFFF", green: "#2D8A4E",
  /** Ant Design green-5 */
  green5: "#52c41a",
};

/** Keys match achievement cards; artwork only — labels and stats come from the card via props. */
const ACHIEVEMENT_MODAL_META = {
  bronze: { tier: "bronze", visual: "medal" },
  silver: { tier: "silver", visual: "medal" },
  gold: { tier: "gold", visual: "medal" },
  ambassador: { visual: "ambassador" },
};

/** Ant Table row rules (students roster): top borders instead of default cell bottom borders. */
const STUDENTS_TABLE_BORDER = "rgba(240, 240, 240, 1)";

/** Fixed sidebar width; main column uses the rest of the viewport. */
const SIDEBAR_WIDTH = 240;

const TIER_LADDER_SEGMENTS = [
  { key: "bronze", flex: 5, fill: "#F28752" },
  { key: "silver", flex: 18, fill: "#BFC5CC" },
  { key: "gold", flex: 12, fill: "#FECD45" },
];

/** Gap between tier labels (above) and the bar; marker pulls up into bar by this many px. */
const TIER_LADDER_LABEL_GAP = 4;
const TIER_LADDER_LABEL_LINE_HEIGHT = 14;
const TIER_LADDER_MARKER_OVERLAP_INTO_BAR = 8;

const BREADCRUMB = {
  board: "Become an Innovative Education Leader",
  students: "My Students",
  teachersRoom: "Teachers Room",
};

const LEADERBOARD_ACADEMIC_LINE = "Academic Year 2025–2026 · Updated weekly";

function AppBreadcrumb({ page, onGoHome }) {
  const crumbHomeIconStyle = {
    fontSize: TYPO.small.fontSize,
    color: "rgb(61, 61, 61)",
    flexShrink: 0,
  };

  if (page === "home") {
    return (
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", minHeight: 40, minWidth: 0 }}>
        <span
          aria-current="page"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            ...typoStyle("base"),
            fontWeight: 700,
            color: colors.ink,
          }}
        >
          <HomeFilled style={crumbHomeIconStyle} aria-hidden />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{MY_SCHOOL_NAME}</span>
        </span>
      </nav>
    );
  }

  const segment =
    page === "students"
      ? BREADCRUMB.students
      : page === "teachersRoom"
        ? BREADCRUMB.teachersRoom
        : BREADCRUMB.board;

  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0, minHeight: 40, minWidth: 0 }}>
      <button
        type="button"
        onClick={onGoHome}
        aria-label="Home"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.muted,
        }}
      >
        <HomeFilled style={crumbHomeIconStyle} aria-hidden />
      </button>
      <span style={{ color: colors.lightGray, padding: "0 8px", ...typoStyle("base"), userSelect: "none" }} aria-hidden="true">/</span>
      <span
        style={{
          ...typoStyle("base"),
          fontWeight: 700,
          color: colors.ink,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {segment}
      </span>
    </nav>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [activeTab, setActiveTab] = useState("allLeaders");

  /** Sidebar highlight follows real routes only — board is under Home. */
  const isPrimaryNavActive = (key) => {
    if (key === "students") return page === "students";
    if (key === "teachersRoom") return page === "teachersRoom";
    if (key === "home") return page === "home" || page === "board";
    return false;
  };

  const handlePrimaryNavClick = (key) => {
    if (key === "home") setPage("home");
    else if (key === "students") setPage("students");
    else if (key === "teachersRoom") setPage("teachersRoom");
  };

  const handleSecondaryNavClick = () => {
    // TODO: wire Competitions / Sent Invitations
  };

  const mainContentNarrow =
    page === "home" || page === "teachersRoom" || page === "students" || page === "board";

  return (
    <ConfigProvider theme={{ token: getKoreezAntdFontTokens() }}>
    <div style={{ minHeight: "100vh", fontFamily: KOREEZ_FONT_FAMILY, background: "#FFFFFF" }}>
      {/* SIDEBAR — fixed full viewport height; nav scrolls; profile pinned to bottom */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 100,
          width: SIDEBAR_WIDTH,
          height: "100vh",
          boxSizing: "border-box",
          background: "white",
          borderRight: `1px solid ${colors.border}`,
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "0 24px 24px", flexShrink: 0 }}>
          <img
            src={koreezLogoSrc()}
            alt="Koreez"
            width={85}
            height={20}
            style={{ display: "block", height: 20, width: "auto" }}
          />
        </div>

        <nav
          aria-label="Main navigation"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.Icon;
            const active = isPrimaryNavActive(item.key);
            return (
              <button
                key={item.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => handlePrimaryNavClick(item.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "0 10px", ...typoStyle("base"),
                  height: 40,
                  margin: "0 12px 4px",
                  borderRadius: 8,
                  fontWeight: 400,
                  color: active ? colors.blue : colors.text,
                  background: active ? "#EBF4FF" : "transparent",
                  border: "none", width: "calc(100% - 24px)", textAlign: "left", cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                <span style={navIconStyle}>
                  <Icon
                    style={item.key === "home" ? { color: active ? colors.blue : "rgb(26, 26, 46)" } : undefined}
                  />
                </span>
                {item.label}
              </button>
            );
          })}

          <div style={{ ...typoStyle("small"), color: colors.lightGray, fontWeight: 400, padding: "20px 24px 8px" }}>Koreez 2026</div>

          {NAV_ITEMS_2.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={handleSecondaryNavClick}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "0 10px", ...typoStyle("base"),
                  height: 40,
                  margin: "0 12px 4px",
                  fontWeight: 400, color: colors.text, background: "transparent",
                  border: "none", width: "calc(100% - 24px)", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={navIconStyle}><Icon /></span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            flexShrink: 0,
            padding: "16px 24px",
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "white",
          }}
        >
          <TeacherAvatar size={32} alt={TEACHER.name} />
          <span style={{ ...typoStyle("base"), fontWeight: 600, color: colors.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{TEACHER.name}</span>
          <span style={{ marginLeft: "auto", color: colors.lightGray, ...typoStyle("large"), flexShrink: 0 }}>›</span>
        </div>
      </aside>

      {/* MAIN CONTENT — full width from sidebar to viewport right; header spans that strip */}
      <main
        style={{
          marginLeft: SIDEBAR_WIDTH,
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          maxWidth: "none",
          minHeight: "100vh",
          minWidth: 0,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        <header
          style={{
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            width: "100%",
            boxSizing: "border-box",
            padding: "16px 40px",
            borderBottom: "1px solid rgba(232, 236, 240, 1)",
            background: "#FFFFFF",
          }}
        >
          <AppBreadcrumb
            page={page}
            onGoHome={() => setPage("home")}
          />
          <button
            type="button"
            aria-label="Notifications, 5 unread"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              color: colors.ink,
              flexShrink: 0,
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            <BellOutlined style={{ fontSize: TYPO.heading4.fontSize }} />
            <span style={{ position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: colors.red, color: "white", ...typoStyle("small"), fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>5</span>
          </button>
        </header>

        <div
          style={{
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            padding: "24px 40px 28px",
            maxWidth: mainContentNarrow ? 1100 : undefined,
            marginLeft: mainContentNarrow ? "auto" : undefined,
            marginRight: mainContentNarrow ? "auto" : undefined,
          }}
        >
          {page === "home" ? (
            <HomePage />
          ) : page === "students" ? (
            <StudentsPage />
          ) : page === "teachersRoom" ? (
            <TeachersRoomPage
              currentTeacherId={TEACHER.id}
              currentTeacherName={TEACHER.name}
              teachersInvitedCount={TEACHER.teachersInvitedCount}
            />
          ) : (
            <BoardPage activeTab={activeTab} setActiveTab={setActiveTab} fullWidth />
          )}
        </div>
      </main>
    </div>
    </ConfigProvider>
  );
}

/** Score + tier block — optional `onOpenBoard` makes it clickable (home); omit on detail views. Set `showHeading={false}` / `showWeeklyTasks={false}` / `singleTierMedalOnly` / `showProgressLadder={false}` / `onScrollToMyRank` on inner pages as needed. Use `rankStatLabel` + `rankStatValue` for school-only rank on the board tab. */
function MyAchievementsWidget({
  onOpenBoard,
  marginBottom = 40,
  showHeading = true,
  showWeeklyTasks = true,
  singleTierMedalOnly = false,
  showProgressLadder = true,
  onScrollToMyRank,
  rankStatLabel = "Rank",
  rankStatValue,
}) {
  const displayRank = rankStatValue !== undefined && rankStatValue !== null ? rankStatValue : TEACHER.rank;
  const interactive = typeof onOpenBoard === "function";
  const showJumpButton = typeof onScrollToMyRank === "function";

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Open leaderboard and score details" : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenBoard(); } } : undefined}
      onClick={interactive ? onOpenBoard : undefined}
      style={{
        background: "white",
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        padding: "20px 24px",
        paddingRight: showJumpButton ? 56 : 24,
        marginBottom,
        cursor: interactive ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative",
        overflow: "visible",
        height: "fit-content",
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(41,144,255,0.1)"; e.currentTarget.style.borderColor = colors.blue; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = colors.border; } : undefined}
    >
      {showJumpButton ? (
        <button
          type="button"
          aria-label="Scroll to my position in the leaderboard"
          onClick={(e) => {
            e.stopPropagation();
            onScrollToMyRank();
          }}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            background: "white",
            color: colors.ink,
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.bg;
            e.currentTarget.style.borderColor = colors.blue;
            e.currentTarget.style.color = colors.blue;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.color = colors.ink;
          }}
        >
          <ArrowDownOutlined style={{ fontSize: TYPO.large.fontSize }} />
        </button>
      ) : null}
      {showHeading ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div className="koreez-page-heading" style={{ ...typoPageHeading(), color: colors.ink }}>Become an Innovative Education Leader</div>
            <div style={{ ...typoStyle("base"), color: colors.muted, marginTop: 6 }}>{LEADERBOARD_ACADEMIC_LINE}</div>
          </div>
          {interactive ? (
            <button
              type="button"
              aria-label="Leaderboard — open score details"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBoard();
              }}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 36,
                marginRight: -6,
                padding: "6px 6px 6px 12px",
                border: "none",
                borderRadius: 8,
                background: "transparent",
                color: colors.ink,
                cursor: "pointer",
                fontFamily: "inherit",
                ...typoStyle("base"),
                fontWeight: 600,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(41, 144, 255, 0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.blue}33`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              <span>Leaderboard</span>
              <RightOutlined style={{ fontSize: TYPO.base.fontSize, lineHeight: TYPO.base.lineHeight }} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: showProgressLadder ? 16 : 0 }}>
        <div style={{ textAlign: "center", minWidth: 72, flexShrink: 0 }}>
          <div style={{ ...typoStyle("heading1"), fontWeight: 800, color: colors.ink, lineHeight: 1, letterSpacing: -1.5 }}>{TEACHER.score}</div>
          <div style={{ ...typoStrong("small"), color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>Score</div>
        </div>

        <div style={{ width: 1, height: 44, background: colors.border, flexShrink: 0 }} />

        <div style={{ display: "flex", gap: 32, flex: 1, alignItems: "center", minWidth: 0 }}>
          <StatBlock value={singleTierMedalOnly ? <TierMedalCurrentOnly tier={TEACHER.tier} /> : <TierMedalsInline tier={TEACHER.tier} />} />
          <div style={{ display: "flex", gap: 32, justifyContent: "flex-start", alignItems: "flex-start" }}>
            <StatBlock label={rankStatLabel} value={`#${displayRank}`} />
            {showWeeklyTasks ? (
              <StatBlock
                gap={4}
                label={`Tasks this week ${TEACHER.weeklyDone}/${TEACHER.weeklyTotal}`}
                value={<WeeklyDots done={TEACHER.weeklyDone} total={TEACHER.weeklyTotal} />}
                labelStyle={{ height: "fit-content" }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {showProgressLadder ? (
        <div onClick={interactive ? (e) => e.stopPropagation() : undefined}>
          <TierProgressLadder tier={TEACHER.tier} percentile={TEACHER.percentile} />
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════
function HomePage({ onOpenBoard }) {
  return (
    <>
      <TeacherProgressWidget />

      {/* CLASSES */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="koreez-page-heading" style={{ ...typoPageHeading(), color: colors.ink }}>My Classes</div>
        <Button type="primary" icon={<PlusOutlined />}>
          New Assignment
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {CLASSES.map((cls) => (
          <div key={cls.id} style={{
            background: "white", borderRadius: 12, border: `1px solid ${colors.border}`,
            padding: 24, cursor: "pointer", transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.blue; e.currentTarget.style.boxShadow = "0 2px 12px rgba(41,144,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ ...typoStyle("heading5"), fontWeight: 700, color: colors.ink, marginBottom: 10 }}>{cls.name}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ ...typoStyle("base"), color: colors.muted }}>
                <strong style={{ color: colors.text, fontWeight: 600 }}>{cls.section}</strong><br />
                {cls.students} students
              </div>
              <div style={{ display: "flex", flexShrink: 0 }}>
                {classCardStudentPreviewSrcs(cls.id).map((src, j) => (
                  <Avatar
                    key={`${cls.id}-${j}`}
                    src={src}
                    size={36}
                    alt=""
                    style={{
                      border: "1px solid white",
                      marginLeft: j === 0 ? 0 : -12,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function achievementCardActivateKeyDown(handler) {
  return (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}

/** Single body paragraph for {@link AchievementDetailModal}. */
function buildAchievementModalDescription(kind, f) {
  if (!kind) return null;
  const {
    bronzeDone,
    silverDone,
    goldDone,
    ambassadorDone,
    bronzeNeed,
    silverNeed,
    goldNeed,
    ambassadorNeed,
  } = f;

  switch (kind) {
    case "bronze":
      return bronzeDone ? (
        <>
          You earned this teacher medal because at least <strong>{bronzeNeed}</strong> of your students hold{" "}
          <strong>bronze student medals</strong>. Students earn those medals after <strong>2 consecutive months</strong> as top performers in your class.
        </>
      ) : (
        <>
          You&apos;ll earn this teacher medal when at least <strong>{bronzeNeed}</strong> of your students hold a{" "}
          <strong>bronze student medal</strong>. Students qualify after <strong>2 consecutive months</strong> as top performers.
        </>
      );
    case "silver":
      return silverDone ? (
        <>
          You earned this teacher medal because at least <strong>{silverNeed}</strong> of your students hold{" "}
          <strong>silver student medals</strong>. Students earn those medals after <strong>4 consecutive months</strong> as top performers in your class.
        </>
      ) : (
        <>
          You&apos;ll earn this teacher medal when at least <strong>{silverNeed}</strong> of your students hold a{" "}
          <strong>silver student medal</strong>. Students qualify after <strong>4 consecutive months</strong> as top performers.
        </>
      );
    case "gold":
      return goldDone ? (
        <>
          You earned this teacher medal because at least <strong>{goldNeed}</strong> of your students hold{" "}
          <strong>gold student medals</strong>. Students earn those medals after <strong>6 consecutive months</strong> as top performers in your class.
        </>
      ) : (
        <>
          You&apos;ll earn this teacher medal when at least <strong>{goldNeed}</strong> of your students hold a{" "}
          <strong>gold student medal</strong>. Students qualify after <strong>6 consecutive months</strong> as top performers.
        </>
      );
    case "ambassador":
      return ambassadorDone ? (
        <>
          You earned the <strong>Ambassador</strong> badge when <strong>{ambassadorNeed}</strong> new students activated{" "}
          <strong>Premium</strong> using your invitation link or code.
        </>
      ) : (
        <>
          You&apos;ll earn the <strong>Ambassador</strong> badge when <strong>{ambassadorNeed}</strong> new students activate{" "}
          <strong>Premium</strong> for the first time through your invitation—your personal link or code must be the one they use to subscribe.
        </>
      );
    default:
      return null;
  }
}

function AchievementDetailModal({ open, onClose, kind, complete, cardTitle, description }) {
  const meta = kind ? ACHIEVEMENT_MODAL_META[kind] : null;
  if (!meta || !cardTitle) return null;

  const onDownloadCertificate = () => {
    message.success("Certificate download will be available when your account is linked to our certificate service.");
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={440}
      centered
      title={null}
      closable={false}
      styles={{ content: { fontFamily: "inherit" }, header: { display: "none" } }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
          padding: "0 4px 8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: 4 }}>
          <Button type="text" icon={<CloseOutlined />} aria-label="Close" onClick={onClose} style={{ color: colors.muted }} />
        </div>
        {meta.visual === "medal" ? (
          <TierMedalImage tier={meta.tier} height={112} style={{ marginBottom: 10 }} />
        ) : (
          <img
            src={tierMedalAssetUrl("ambassador.svg")}
            alt=""
            height={112}
            style={{
              height: 112,
              width: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              display: "block",
              marginBottom: 10,
            }}
          />
        )}
        <div style={{ ...typoStyle("heading4"), fontWeight: 700, color: colors.ink }}>{cardTitle}</div>
        {description ? (
          <p
            style={{
              ...typoStyle("small"),
              color: colors.text,
              marginTop: 10,
              marginBottom: 0,
              lineHeight: 1.6,
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            {description}
          </p>
        ) : null}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          disabled={!complete}
          onClick={onDownloadCertificate}
          block
          style={{ marginTop: 16, fontWeight: 600, alignSelf: "stretch", maxWidth: "100%" }}
        >
          Download certificate
        </Button>
        {!complete ? (
          <p style={{ ...typoStyle("small"), color: colors.muted, marginTop: 12, marginBottom: 0 }}>
            Complete this milestone to unlock your certificate.
          </p>
        ) : (
          <p style={{ ...typoStyle("small"), color: colors.muted, marginTop: 12, marginBottom: 0 }}>
            Share with friends.
          </p>
        )}
      </div>
    </Modal>
  );
}

function TeacherOfTheYearPageDrawer({ open, onClose, progress }) {
  const myTotyRowRef = useRef(null);

  const scrollToMyTotyRow = () => {
    myTotyRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const drawerStyles = {
    content: { fontFamily: "inherit" },
    header: {
      fontFamily: "inherit",
      borderBottom: `1px solid ${colors.border}`,
      padding: "10px 20px",
    },
    body: {
      fontFamily: "inherit",
      padding: "8px 20px 28px",
      background: colors.card,
    },
  };

  return (
    <Drawer
      title={(
        <span style={{ ...typoStyle("large"), fontWeight: 600, color: colors.ink, fontFamily: "inherit" }}>
          Teacher of the Year ({progress.teacherOfYearSeasonLabel})
        </span>
      )}
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={drawerStyles}
      maskStyle={{ background: "rgba(26, 26, 46, 0.45)" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 16,
          height: "fit-content",
          background: colors.bg,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <img
          src={tierMedalAssetUrl("trophy.svg")}
          alt=""
          height={64}
          style={{ height: 64, width: "auto", objectFit: "contain", flexShrink: 0, marginTop: 0 }}
        />
        <p
          style={{
            ...typoStyle("small"),
            color: colors.text,
            margin: 0,
            textAlign: "left",
            flex: 1,
            minWidth: 0,
          }}
        >
          {TEACHER_OF_YEAR_DRAWER_INTRO}
        </p>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div style={{ ...typoStyle("large"), fontWeight: 700, color: colors.ink }}>Leaderboard</div>
          <Button
            type="default"
            size="small"
            icon={<ArrowDownOutlined aria-hidden />}
            onClick={scrollToMyTotyRow}
            aria-label="Scroll to my position in the leaderboard"
            style={{ fontWeight: 600, flexShrink: 0 }}
          >
            My position
          </Button>
        </div>
        <div>
          {TEACHER_OF_YEAR_LEADERBOARD.map((p) => (
            <LeaderboardRow
              key={p.rank}
              rank={p.rank}
              name={p.name}
              school={p.school}
              score={p.points.toLocaleString()}
              tier="gold"
              isYou={p.isYou}
              avatarSrc={leaderboardAvatarSrc(p.rank, p.isYou)}
              rowRef={p.isYou ? myTotyRowRef : undefined}
            />
          ))}
        </div>
      </div>
    </Drawer>
  );
}

function TeacherProgressWidget() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [achievementModalKind, setAchievementModalKind] = useState(null);
  const [totyDrawerOpen, setTotyDrawerOpen] = useState(false);
  const progress = TEACHER_PROGRESS_MOCK;
  const bronzeNeed = 5;
  const silverNeed = 10;
  const goldNeed = 20;
  const ambassadorNeed = 20;
  const nBronze = progress.studentsByMedal.bronze;
  const nSilver = progress.studentsByMedal.silver;
  const nGold = progress.studentsByMedal.gold;
  const nAmbassador = progress.invitesConvertedToPremium;
  const bronzeDone = nBronze >= bronzeNeed;
  const silverDone = nSilver >= silverNeed;
  const goldDone = nGold >= goldNeed;
  const ambassadorDone = nAmbassador >= ambassadorNeed;
  const medalOpacity = (done) => (done ? 1 : 0.3);
  const totyBar = Math.max(0, Math.min(1, progress.teacherOfYearBarProgress ?? 0));

  const achievementCardShell = {
    background: colors.card,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 2px 10px rgba(26, 26, 46, 0.06)",
    padding: "24px 16px 16px",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const achievementModalDescription = buildAchievementModalDescription(achievementModalKind, {
    bronzeDone,
    silverDone,
    goldDone,
    ambassadorDone,
    bronzeNeed,
    silverNeed,
    goldNeed,
    ambassadorNeed,
  });

  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 12,
          minWidth: 0,
        }}
      >
        <div className="koreez-page-heading" style={{ ...typoPageHeading(), color: colors.ink, margin: 0, minWidth: 0 }}>
          My Achievements
        </div>
        <Button
          type="default"
          icon={<ExclamationCircleOutlined style={{ color: colors.blue }} aria-hidden />}
          onClick={() => setRulesOpen(true)}
          style={{ flexShrink: 0, fontWeight: 600 }}
          aria-label="Open rules"
        />
      </div>

      <Drawer
        title={(
          <span style={{ ...typoStyle("large"), fontWeight: 600, color: colors.ink, fontFamily: "inherit" }}>
            Achievement rules
          </span>
        )}
        placement="right"
        width={560}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        destroyOnClose
        styles={{
          content: { fontFamily: "inherit" },
          header: {
            fontFamily: "inherit",
            borderBottom: `1px solid ${colors.border}`,
            padding: "14px 20px",
          },
          body: {
            fontFamily: "inherit",
            padding: "16px 20px 28px",
            background: colors.card,
          },
        }}
        maskStyle={{ background: "rgba(26, 26, 46, 0.45)" }}
      >
        <ProgressionRulesDrawerContent />
      </Drawer>

      <AchievementDetailModal
        open={achievementModalKind != null}
        onClose={() => setAchievementModalKind(null)}
        kind={achievementModalKind}
        cardTitle={
          achievementModalKind === "bronze"
            ? "Bronze Medal"
            : achievementModalKind === "silver"
              ? "Silver Medal"
              : achievementModalKind === "gold"
                ? "Gold Medal"
                : achievementModalKind === "ambassador"
                  ? "Ambassador"
                  : ""
        }
        complete={
          achievementModalKind === "bronze"
            ? bronzeDone
            : achievementModalKind === "silver"
              ? silverDone
              : achievementModalKind === "gold"
                ? goldDone
                : achievementModalKind === "ambassador"
                  ? ambassadorDone
                  : false
        }
        description={achievementModalDescription}
      />

      <TeacherOfTheYearPageDrawer open={totyDrawerOpen} onClose={() => setTotyDrawerOpen(false)} progress={progress} />

      <div
        style={{
          background: colors.bg,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          padding: "12px 12px",
        }}
      >
        <div className="teacher-achievements-grid">
        {/* Row 1 mobile: bronze, silver */}
        <div
          style={{ ...achievementCardShell, cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onClick={() => setAchievementModalKind("bronze")}
          onKeyDown={achievementCardActivateKeyDown(() => setAchievementModalKind("bronze"))}
        >
          <TierMedalImage tier="bronze" height={60} style={{ marginBottom: 10, opacity: medalOpacity(bronzeDone) }} />
          <div style={{ ...typoStyle("base"), fontWeight: 700, color: colors.ink }}>Bronze Medal</div>
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4 }}>
            {nBronze}/{bronzeNeed} Bronze medalists
          </div>
          <AchievementProgressFooter complete={bronzeDone} fillRatio={nBronze / bronzeNeed} fillColor="#32D9A1" />
        </div>

        <div
          style={{ ...achievementCardShell, cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onClick={() => setAchievementModalKind("silver")}
          onKeyDown={achievementCardActivateKeyDown(() => setAchievementModalKind("silver"))}
        >
          <TierMedalImage tier="silver" height={60} style={{ marginBottom: 10, opacity: medalOpacity(silverDone) }} />
          <div style={{ ...typoStyle("base"), fontWeight: 700, color: colors.ink }}>Silver Medal</div>
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4 }}>
            {nSilver}/{silverNeed} Silver medalists
          </div>
          <AchievementProgressFooter complete={silverDone} fillRatio={nSilver / silverNeed} fillColor="#32D9A1" />
        </div>

        {/* Row 2 mobile: gold, ambassador */}
        <div
          style={{ ...achievementCardShell, cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onClick={() => setAchievementModalKind("gold")}
          onKeyDown={achievementCardActivateKeyDown(() => setAchievementModalKind("gold"))}
        >
          <TierMedalImage tier="gold" height={60} style={{ marginBottom: 10, opacity: medalOpacity(goldDone) }} />
          <div style={{ ...typoStyle("base"), fontWeight: 700, color: colors.ink }}>Gold Medal</div>
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4 }}>
            {nGold}/{goldNeed} Gold medalists
          </div>
          <AchievementProgressFooter complete={goldDone} fillRatio={nGold / goldNeed} fillColor="#32D9A1" />
        </div>

        <div
          style={{ ...achievementCardShell, cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onClick={() => setAchievementModalKind("ambassador")}
          onKeyDown={achievementCardActivateKeyDown(() => setAchievementModalKind("ambassador"))}
        >
          <img
            src={tierMedalAssetUrl("ambassador.svg")}
            alt=""
            height={60}
            style={{
              height: 60,
              width: "auto",
              objectFit: "contain",
              marginBottom: 10,
              display: "block",
              opacity: medalOpacity(ambassadorDone),
            }}
          />
          <div style={{ ...typoStyle("base"), fontWeight: 700, color: colors.ink }}>Ambassador</div>
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4 }}>
            {nAmbassador}/{ambassadorNeed} Invites
          </div>
          <AchievementProgressFooter complete={ambassadorDone} fillRatio={nAmbassador / ambassadorNeed} fillColor="#32D9A1" />
        </div>

        {/* Row 3 mobile: full width — same vertical stack as other cards */}
        <div
          className="teacher-achievements-toty"
          style={{ ...achievementCardShell, cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onClick={() => setTotyDrawerOpen(true)}
          onKeyDown={achievementCardActivateKeyDown(() => setTotyDrawerOpen(true))}
        >
          <img
            src={tierMedalAssetUrl("trophy.svg")}
            alt=""
            height={60}
            style={{ height: 60, width: "auto", objectFit: "contain", marginBottom: 10, display: "block" }}
          />
          <div style={{ ...typoStyle("base"), fontWeight: 700, color: colors.ink }}>
            Teacher of the Year ({progress.teacherOfYearSeasonLabel})
          </div>
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4 }}>
            {(progress.teacherOfYearPoints ?? 0).toLocaleString()} points · {progress.teacherOfYearRankingLine}
          </div>
          <div
            style={{
              paddingTop: 16,
              width: "100%",
              position: "relative",
              height: 20,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50%",
                marginTop: -2,
                height: 4,
                borderRadius: 2,
                background: "#E8ECF0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${totyBar * 100}%`,
                  borderRadius: 2,
                  background: "#FECD45",
                  transition: "width 0.25s ease",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: `${totyBar * 100}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "2px solid white",
                overflow: "hidden",
                background: colors.border,
                zIndex: 1,
              }}
            >
              <TeacherAvatar size={24} alt="" style={{ borderRadius: "50%" }} />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// BOARD PAGE (detail view)
// ═══════════════════════════════════════
function BoardPage({ activeTab, setActiveTab, fullWidth }) {
  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false);

  const tabContentWrapStyle = {
    maxWidth: fullWidth ? "none" : 600,
    width: "100%",
    margin: fullWidth ? 0 : "0 auto",
  };

  const rulesTrigger = (
    <button
      type="button"
      aria-expanded={rulesDrawerOpen}
      aria-controls="board-rules-drawer"
      aria-label="Open rules"
      onClick={() => setRulesDrawerOpen(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        padding: "8px 14px",
        ...typoStyle("base"),
        fontWeight: 600,
        fontFamily: "inherit",
        color: colors.ink,
        background: "white",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.bg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "white";
      }}
    >
      <ExclamationCircleOutlined style={{ fontSize: TYPO.large.fontSize, color: colors.blue }} aria-hidden />
    </button>
  );

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <div className="koreez-page-heading" style={{ ...typoPageHeading(), color: colors.ink }}>Innovative Education Leaders</div>
          <div style={{ ...typoStyle("base"), color: colors.muted, marginTop: 6 }}>{LEADERBOARD_ACADEMIC_LINE}</div>
        </div>
      </div>

      <Drawer
        id="board-rules-drawer"
        title={(
          <span style={{ ...typoStyle("large"), fontWeight: 600, color: colors.ink, fontFamily: "inherit" }}>
            Scoring rules
          </span>
        )}
        placement="right"
        width={560}
        open={rulesDrawerOpen}
        onClose={() => setRulesDrawerOpen(false)}
        destroyOnClose
        styles={{
          content: { fontFamily: "inherit" },
          header: {
            fontFamily: "inherit",
            borderBottom: `1px solid ${colors.border}`,
            padding: "14px 20px",
          },
          body: {
            fontFamily: "inherit",
            padding: "16px 20px 28px",
            background: colors.card,
          },
        }}
        maskStyle={{ background: "rgba(26, 26, 46, 0.45)" }}
      >
        <RulesDrawerContent />
      </Drawer>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={{ right: rulesTrigger }}
        destroyInactiveTabPane
        style={{ marginBottom: 20 }}
        items={[
          {
            key: "allLeaders",
            label: "All leaders",
            children: (
              <div style={tabContentWrapStyle}>
                <LeaderboardScoreTab />
              </div>
            ),
          },
          {
            key: "mySchool",
            label: "My school",
            children: (
              <div style={tabContentWrapStyle}>
                <LeaderboardScoreTab
                  boardRows={SCHOOL_LEADERBOARD_ROWS}
                  rankStatLabel="School rank"
                  rankStatValue={TEACHER.schoolRank}
                  leaderboardCaption={<>Leaderboard for <strong style={{ color: colors.text }}>{MY_SCHOOL_NAME}</strong> — scores and tiers are the same as globally; only colleagues from your school are listed.</>}
                />
              </div>
            ),
          },
        ]}
      />

      <div style={{ textAlign: "center", ...typoStyle("small"), color: colors.lightGray, marginTop: 20 }}>
        Koreez · Tier rankings update weekly
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// STUDENTS PAGE (roster, premium)
// ═══════════════════════════════════════
async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    message.success("Copied to clipboard");
  } catch {
    message.error("Could not copy — try selecting the link manually.");
  }
}

const STUDENT_PREMIUM_BENEFITS_INTRO =
  "Use your personal discount link to give students access to Koreez at a reduced price. With the subscription, they will be able to:";

const STUDENT_PREMIUM_BENEFITS_ITEMS = [
  "Master the school curriculum through structured lessons",
  "Prepare effectively for thematic and school tests",
  "Track their results and monitor progress over time",
  "Review correct answers and understand mistakes",
  "Access clear explanations for every question",
  "Collect and store certificates of achievement",
  "See their position in the class leaderboard",
  "Train specifically for Koreez competitions",
  "Get early access to new learning features",
];

/** List prices in the student app (USD). Teacher invite link applies TEACHER_YEARLY_DISCOUNT_FRACTION to yearly only. */
const STUDENT_PREMIUM_PRICE_YEARLY = 25.99;
const TEACHER_YEARLY_DISCOUNT_FRACTION = 0.5;
const TEACHER_DISCOUNT_BADGE_PCT = 78;

function formatStudentPriceUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const studentPremiumWithTeacherLinkYearly =
  STUDENT_PREMIUM_PRICE_YEARLY * (1 - TEACHER_YEARLY_DISCOUNT_FRACTION);
const studentPremiumWithTeacherLinkMonthlyEffective = studentPremiumWithTeacherLinkYearly / 12;
const studentPremiumYearlyEffectiveMonthly = STUDENT_PREMIUM_PRICE_YEARLY / 12;

const STUDENT_PRICE_YEARLY_STR = formatStudentPriceUsd(STUDENT_PREMIUM_PRICE_YEARLY);
const STUDENT_PRICE_TEACHER_YEAR_STR = formatStudentPriceUsd(studentPremiumWithTeacherLinkYearly);
const STUDENT_PRICE_TEACHER_PER_MO_STR = formatStudentPriceUsd(studentPremiumWithTeacherLinkMonthlyEffective);
const STUDENT_PRICE_YEARLY_PER_MO_STR = formatStudentPriceUsd(studentPremiumYearlyEffectiveMonthly);

const CLASS_ACCESS_DESCRIPTION =
  "Share class access and give students 78% off annual Koreez Premium.";

const FREE_YEARLY_SPOTS_THRESHOLD = 20;
const FREE_YEARLY_SPOTS_COUNT = 3;

/** Class Access section — single white card (achievement-style shell). */
const classAccessCardShell = {
  width: "100%",
  boxSizing: "border-box",
  background: colors.card,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  boxShadow: "none",
  padding: "20px",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
};

function StudentDiscountInviteModalContent({ hint, url, qrAlt }) {
  return (
    <>
      <p style={{ ...typoStyle("base"), color: colors.muted, marginTop: 0 }}>{hint}</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          padding: 12,
          background: colors.card,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
        }}
      >
        <span style={{ ...typoStrong("small"), color: colors.text }}>Scan to open</span>
        <img
          src={qrCodeImageSrc()}
          alt={qrAlt}
          width={200}
          height={200}
          style={{ width: 200, height: "auto", display: "block", borderRadius: 6 }}
        />
      </div>
      <div
        style={{
          ...typoStyle("small"),
          wordBreak: "break-all",
          fontFamily: "ui-monospace, monospace",
          padding: 12,
          background: colors.bg,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          marginBottom: 0,
        }}
      >
        {url}
      </div>
    </>
  );
}

function FreeYearlySpotsBand({ current, threshold, spotsTotal, spotsUsed = 0 }) {
  const unlocked = current >= threshold;
  const progress = Math.max(0, Math.min(1, threshold ? current / threshold : 0));
  const ringSize = 36;
  const stroke = 2;
  const r = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      style={{
        width: "100%",
        marginTop: 0,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, width: "100%", alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flex: "0 0 auto", alignItems: "flex-start" }}>
          {Array.from({ length: spotsTotal }, (_, i) => {
          const used = unlocked && i < spotsUsed;
          const locked = !unlocked;
          const circleBg = "#FFFFFF";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  background: circleBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <svg
                  width={ringSize}
                  height={ringSize}
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                  style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
                  aria-hidden
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={r}
                    fill="none"
                    stroke="rgb(232, 236, 240)"
                    strokeWidth={stroke}
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={r}
                    fill="none"
                    stroke="rgb(50, 217, 161)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 0.45s ease" }}
                  />
                </svg>
                {locked ? (
                  <LockOutlined style={{ fontSize: 16, color: colors.lightGray, position: "relative", zIndex: 1 }} aria-hidden />
                ) : used ? (
                  <img
                    src={studentAvatarSrc(`free-spot-used-${i}`)}
                    alt=""
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      objectFit: "cover",
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                ) : (
                  <CheckOutlined style={{ fontSize: 18, color: colors.green5, position: "relative", zIndex: 1 }} aria-hidden />
                )}
              </div>
              {!locked ? (
                <span
                  style={{
                    ...typoStyle("small"),
                    color: used ? colors.muted : colors.ink,
                    fontWeight: 600,
                  }}
                >
                  {used ? "Used" : "Available"}
                </span>
              ) : null}
            </div>
          );
          })}
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <span style={{ fontSize: 12, lineHeight: "20px", fontWeight: 400, color: "rgba(0,0,0,0.45)" }}>
            {current}/{threshold} students join premium via your invite.
          </span>
        </div>
      </div>
    </div>
  );
}

function StudentsPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "My Students · Koreez";
    return () => {
      document.title = prev;
    };
  }, []);

  const [students, setStudents] = useState(() => STUDENTS_INITIAL.map((s) => ({ ...s })));
  const [payFor, setPayFor] = useState(null);
  const [profileFor, setProfileFor] = useState(null);
  const [bulkLinkOpen, setBulkLinkOpen] = useState(false);
  const [premiumBenefitsDrawerOpen, setPremiumBenefitsDrawerOpen] = useState(false);
  const [bulkLinkUrl, setBulkLinkUrl] = useState("");
  const [bulkLinkTitle, setBulkLinkTitle] = useState("");
  const [bulkLinkHint, setBulkLinkHint] = useState(
    "Students who open this link see yearly Premium with your 50% teacher discount applied.",
  );
  const [inviteClassId, setInviteClassId] = useState(null);

  const classById = useMemo(() => Object.fromEntries(CLASSES.map((c) => [c.id, c])), []);

  const classSections = useMemo(() => {
    return CLASSES.map((cls) => {
      const rows = students.filter((s) => s.classId === cls.id).slice().sort(sortStudentsByLastName);
      return { cls, rows };
    });
  }, [students]);

  const openClassInviteModal = useCallback((classId) => {
    setInviteClassId(classId);
  }, []);

  const inviteStudentUrl = inviteClassId ? buildBulkYearlyDiscountUrl({ allRoster: false, classId: inviteClassId }) : "";

  const openBulkLinkModal = () => {
    setBulkLinkUrl(buildBulkYearlyDiscountUrl({ allRoster: true, classId: null }));
    setBulkLinkTitle("Invite students");
    setBulkLinkHint("Students who open this link see yearly Premium with your 50% teacher discount applied.");
    setBulkLinkOpen(true);
  };

  const confirmPayForStudent = () => {
    if (!payFor) return;
    // TODO: Stripe / payment provider
    const till = premiumActiveTillOneYearFromNow();
    setStudents((prev) => prev.map((s) => (s.id === payFor.id ? { ...s, isPremium: true, activeTill: till } : s)));
    message.success(`${payFor.name} now has Premium (demo — no charge processed).`);
    setPayFor(null);
  };

  const studentColumns = useMemo(
    () => [
      {
        title: "Name",
        key: "name",
        render: (_, row) => {
          if (row.__addRow) {
            return {
              children: (
                <Button
                  type="link"
                  icon={<UserAddOutlined />}
                  onClick={() => openClassInviteModal(row.classId)}
                  style={{ padding: 0, height: "auto", fontWeight: 400 }}
                >
                  Add student
                </Button>
              ),
              props: { colSpan: 3 },
            };
          }
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar src={studentAvatarSrc(row.id)} size={32} alt="" style={{ border: "none", flexShrink: 0 }} />
              <span>{displayNameLastFirst(row.name)}</span>
            </div>
          );
        },
      },
      {
        title: "Status",
        key: "status",
        width: 100,
        render: (_, row) => {
          if (row.__addRow) return { children: null, props: { colSpan: 0 } };
          return row.isPremium ? <Tag color="success">Premium</Tag> : <Tag>Free</Tag>;
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 56,
        align: "center",
        render: (_, row) => {
          if (row.__addRow) return { children: null, props: { colSpan: 0 } };
          return (
            <Dropdown
              trigger={["click"]}
              getPopupContainer={() => document.body}
              menu={{
                items: [
                  { key: "profile", label: "View Profile", icon: <UserOutlined /> },
                  {
                    key: "activateFree",
                    label: "Activate for free",
                    icon: <GiftOutlined />,
                    disabled: true,
                  },
                  ...(row.isPremium
                    ? []
                    : [{ key: "sendDiscount", label: "Send class discount", icon: <SendOutlined /> }]),
                  {
                    key: "pay",
                    label: "Pay for Student",
                    icon: <DollarOutlined />,
                    disabled: row.isPremium,
                  },
                  {
                    key: "remove",
                    label: "Remove from class",
                    icon: <DeleteOutlined />,
                    danger: true,
                  },
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === "profile") {
                    setProfileFor(row);
                  } else if (key === "sendDiscount") {
                    message.success(`Class discount sent to ${row.name}.`);
                  } else if (key === "pay") {
                    setPayFor(row);
                  } else if (key === "remove") {
                    Modal.confirm({
                      title: "Remove from class",
                      content: `Remove ${row.name} from ${classLabel(classById[row.classId])}? They will no longer appear in this class roster.`,
                      okText: "Remove",
                      okType: "danger",
                      cancelText: "Cancel",
                      onOk: () => {
                        setStudents((prev) => prev.filter((s) => s.id !== row.id));
                        message.success(`${row.name} removed from class.`);
                      },
                    });
                  }
                },
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined style={{ fontSize: TYPO.heading4.fontSize }} />}
                aria-label={`More actions for ${row.name}`}
                aria-haspopup="menu"
                style={{ color: colors.ink }}
              />
            </Dropdown>
          );
        },
      },
    ],
    [classById, openClassInviteModal],
  );

  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <h1 className="koreez-page-heading" style={{ ...typoPageHeading(), color: colors.ink, margin: 0 }}>
            Class Access
          </h1>
          <Button
            onClick={() => setPremiumBenefitsDrawerOpen(true)}
            icon={<ExclamationCircleOutlined style={{ color: colors.blue }} />}
            style={{ fontWeight: 600 }}
            aria-label="Open included benefits"
          />
        </div>
        <div style={classAccessCardShell}>
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 420px", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ ...typoStyle("heading5"), fontWeight: 700, color: colors.ink, fontSize: 20, lineHeight: "28px" }}>
                    {STUDENT_PRICE_TEACHER_YEAR_STR}
                    <span style={{ ...typoStyle("base"), fontWeight: 600, color: colors.ink }}>/yr</span>
                  </span>
                  <Tag
                    style={{
                      margin: 0,
                      background: "rgb(188, 255, 125)",
                      color: colors.ink,
                      border: "none",
                      fontWeight: 700,
                      fontSize: 14,
                      lineHeight: "22px",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    -{TEACHER_DISCOUNT_BADGE_PCT}%
                  </Tag>
                </div>
                <div style={{ ...typoStyle("base"), fontSize: 12, lineHeight: "20px", color: colors.muted, marginBottom: 0 }}>
                  Only $1 per month instead of $4.69
                </div>
                <p style={{ ...typoStyle("base"), color: colors.muted, margin: "8px 0 0", lineHeight: 1.55 }}>
                  {CLASS_ACCESS_DESCRIPTION}
                  <br />
                  After {FREE_YEARLY_SPOTS_THRESHOLD} students join via your link, you can invite{" "}
                  {FREE_YEARLY_SPOTS_COUNT} students to use Premium for free.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <Button
                  type="primary"
                  icon={<GiftOutlined />}
                  onClick={openBulkLinkModal}
                  style={{ borderRadius: 8, fontWeight: 400, flexShrink: 0 }}
                >
                  Share class access
                </Button>
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <FreeYearlySpotsBand
                current={TEACHER_PROGRESS_MOCK.invitesConvertedToPremium}
                threshold={FREE_YEARLY_SPOTS_THRESHOLD}
                spotsTotal={FREE_YEARLY_SPOTS_COUNT}
                spotsUsed={TEACHER_PROGRESS_MOCK.freeYearlySpotsUsed ?? 0}
              />
            </div>
          </div>
        </div>
      </div>

      <Drawer
        id="student-premium-benefits-drawer"
        title={(
          <span style={{ ...typoStyle("large"), fontWeight: 600, color: colors.ink, fontFamily: "inherit" }}>
            What students get with Premium
          </span>
        )}
        placement="right"
        width={560}
        open={premiumBenefitsDrawerOpen}
        onClose={() => setPremiumBenefitsDrawerOpen(false)}
        destroyOnClose
        styles={{
          content: { fontFamily: "inherit" },
          header: {
            fontFamily: "inherit",
            borderBottom: `1px solid ${colors.border}`,
            padding: "14px 20px",
          },
          body: {
            fontFamily: "inherit",
            padding: "16px 20px 28px",
            background: colors.card,
          },
        }}
        maskStyle={{ background: "rgba(26, 26, 46, 0.45)" }}
      >
        <StudentPremiumBenefitsDrawerContent />
      </Drawer>

      <h1 className="koreez-page-heading" style={{ ...typoPageHeading(), color: colors.ink, margin: "0 0 16px" }}>
        My Students
      </h1>

      {CLASSES.length === 0 ? (
        <div style={{ ...typoStyle("base"), color: colors.muted, padding: "24px 0" }}>
          No classes configured.
        </div>
      ) : (
        <ConfigProvider
          theme={{
            components: {
              Table: {
                borderColor: STUDENTS_TABLE_BORDER,
                cellPaddingBlock: 8,
                cellPaddingBlockMD: 8,
                cellPaddingBlockSM: 8,
                headerBg: "#FFFFFF",
                headerSortActiveBg: "#FFFFFF",
                headerSortHoverBg: "#FFFFFF",
                fixedHeaderSortActiveBg: "#FFFFFF",
                headerFilterHoverBg: "#FFFFFF",
              },
              Collapse: {
                headerBg: "#FFFFFF",
                contentBg: "#FFFFFF",
                contentPadding: 0,
              },
            },
          }}
        >
          <style>{`
            .koreez-students-table .ant-table-thead > tr > th {
              background: #ffffff !important;
              padding-top: calc(16px + 4px) !important;
              padding-bottom: calc(16px + 4px) !important;
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            .koreez-students-table .ant-table-tbody > tr > th,
            .koreez-students-table .ant-table-tbody > tr > td {
              border-bottom: none !important;
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            .koreez-students-table .ant-table-tbody > tr:not(:first-child) > th,
            .koreez-students-table .ant-table-tbody > tr:not(:first-child) > td {
              border-top: 1px solid ${STUDENTS_TABLE_BORDER} !important;
            }
            .koreez-students-table .koreez-students-add-row > th,
            .koreez-students-table .koreez-students-add-row > td {
              padding-top: 14px !important;
              padding-bottom: 14px !important;
            }
            .koreez-students-collapse.ant-collapse {
              border-radius: 12px;
              overflow: hidden;
              border-color: ${colors.border};
              background: #ffffff !important;
            }
            .koreez-students-collapse .ant-collapse-item {
              border-color: ${colors.border};
              background: #ffffff !important;
            }
            .koreez-students-collapse .ant-collapse-header {
              background: #ffffff !important;
              padding-top: calc(12px + 4px) !important;
              padding-bottom: calc(12px + 4px) !important;
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            .koreez-students-collapse .ant-collapse-content {
              background: #ffffff !important;
            }
          `}</style>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
            {classSections.map(({ cls, rows }) => (
              <Collapse
                key={cls.id}
                className="koreez-students-collapse"
                bordered
                expandIconPosition="start"
                defaultActiveKey={cls.id}
                items={[
                  {
                    key: cls.id,
                    label: (
                      <span
                        id={`students-class-${cls.id}`}
                        style={{ ...typoStyle("heading5"), fontWeight: 700, color: colors.ink }}
                      >
                        {classLabel(cls)}
                      </span>
                    ),
                    children: (
                      <Table
                        className="koreez-students-table"
                        rowKey="id"
                        rowClassName={(row) => (row.__addRow ? "koreez-students-add-row" : "")}
                        columns={studentColumns}
                        dataSource={[
                          ...rows,
                          { id: `__add-${cls.id}`, __addRow: true, classId: cls.id },
                        ]}
                        pagination={false}
                        showHeader={false}
                        locale={{ emptyText: "No students in this class." }}
                        scroll={{ x: "max-content" }}
                      />
                    ),
                  },
                ]}
              />
            ))}
          </div>
        </ConfigProvider>
      )}

      <Modal
        title={bulkLinkTitle}
        open={bulkLinkOpen}
        onCancel={() => setBulkLinkOpen(false)}
        width={520}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => copyTextToClipboard(bulkLinkUrl)}>
            Copy link
          </Button>,
          <Button key="close" onClick={() => setBulkLinkOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <StudentDiscountInviteModalContent
          hint={bulkLinkHint}
          url={bulkLinkUrl}
          qrAlt="QR code for the student invitation link"
        />
      </Modal>

      <Modal
        title={inviteClassId ? `Invite student · ${classLabel(classById[inviteClassId])}` : "Invite student"}
        open={!!inviteClassId}
        onCancel={() => setInviteClassId(null)}
        width={520}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => copyTextToClipboard(inviteStudentUrl)}>
            Copy link
          </Button>,
          <Button key="close" onClick={() => setInviteClassId(null)}>
            Close
          </Button>,
        ]}
      >
        <StudentDiscountInviteModalContent
          hint={(
            <>
              Share this invite link with a new student for{" "}
              <strong>{inviteClassId ? classLabel(classById[inviteClassId]) : ""}</strong>. It opens yearly Premium with your teacher discount (class-scoped link).
            </>
          )}
          url={inviteStudentUrl}
          qrAlt="QR code for the class-scoped student invite link"
        />
      </Modal>

      <Modal
        title={profileFor ? profileFor.name : "Student profile"}
        open={!!profileFor}
        onCancel={() => setProfileFor(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setProfileFor(null)}>
            Close
          </Button>,
        ]}
      >
        {profileFor ? (
          <div style={{ ...typoStyle("base"), color: colors.text }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <Avatar src={studentAvatarSrc(profileFor.id)} size={64} alt="" />
              <div>
                <div style={{ ...typoStyle("heading5"), fontWeight: 700, color: colors.ink }}>{profileFor.name}</div>
                <div style={{ ...typoStyle("base"), color: colors.muted, marginTop: 4 }}>
                  {classLabel(classById[profileFor.classId])}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <span style={{ color: colors.muted, ...typoStyle("small") }}>Status</span>
                <div style={{ marginTop: 2 }}>
                  {profileFor.isPremium ? <Tag color="success">Premium</Tag> : <Tag>Free</Tag>}
                </div>
              </div>
              <div>
                <span style={{ color: colors.muted, ...typoStyle("small") }}>Active until</span>
                <div style={{ marginTop: 2 }}>
                  {profileFor.isPremium && profileFor.activeTill
                    ? new Date(profileFor.activeTill).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title={payFor ? `Pay for ${payFor.name}` : "Pay for student"}
        open={!!payFor}
        onCancel={() => setPayFor(null)}
        okText="Confirm payment"
        onOk={confirmPayForStudent}
        okButtonProps={{ icon: <DollarOutlined /> }}
      >
        {payFor ? (
          <p style={{ ...typoStyle("base"), color: colors.text, marginTop: 0 }}>
            You will be charged for <strong>one year</strong> of Premium at the teacher rate, and{" "}
            <strong>{payFor.name}</strong> will be activated immediately after payment succeeds.
          </p>
        ) : null}
        <p style={{ ...typoStyle("small"), color: colors.muted, marginBottom: 0 }}>
          {/* TODO: payment provider */}
          Demo: confirming skips checkout and toggles Premium locally.
        </p>
      </Modal>
    </>
  );
}

// ── LEADERBOARD TAB (your score + full leaderboard) ──
function LeaderboardScoreTab({
  boardRows,
  rankStatLabel,
  rankStatValue,
  leaderboardCaption,
}) {
  const myLeaderboardRowRef = useRef(null);
  const allBoardRows = boardRows ?? [...LEADERBOARD_TOP, ...NEARBY];
  const byTier = groupLeaderboardByTier(allBoardRows);

  const scrollToMyRank = () => {
    myLeaderboardRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <MyAchievementsWidget
        marginBottom={leaderboardCaption ? 12 : 16}
        showHeading={false}
        showWeeklyTasks={false}
        singleTierMedalOnly
        showProgressLadder={false}
        onScrollToMyRank={scrollToMyRank}
        rankStatLabel={rankStatLabel}
        rankStatValue={rankStatValue}
      />

      {leaderboardCaption ? (
        <div style={{ ...typoStyle("base"), color: colors.muted, marginBottom: 16 }}>
          {leaderboardCaption}
        </div>
      ) : null}

      {LEADERBOARD_TIER_ORDER.map((tierKey) => {
        const rows = byTier[tierKey];
        const t = TIER_CONFIG[tierKey];
        return (
          <Card
            key={tierKey}
            title={(
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <TierMedalImage tier={tierKey} height={32} style={{ display: "block" }} />
                <span>{t.label}</span>
              </span>
            )}
            subtitle={LEADERBOARD_TIER_DESCRIPTIONS[tierKey]}
          >
            {rows.length > 0 ? (
              rows.map((p) => (
                <LeaderboardRow
                  key={p.rank}
                  {...p}
                  rowRef={p.isYou ? myLeaderboardRowRef : undefined}
                  avatarSrc={leaderboardAvatarSrc(p.rank, p.isYou)}
                />
              ))
            ) : (
              <div style={{ ...typoStyle("base"), color: colors.muted, padding: "8px 0" }}>No teachers in this tier in the current list.</div>
            )}
          </Card>
        );
      })}
    </>
  );
}

function StudentPremiumBenefitsDrawerContent() {
  return (
    <div style={{ ...typoStyle("base"), color: colors.text }}>
      <p style={{ margin: "0 0 16px", color: colors.ink }}>{STUDENT_PREMIUM_BENEFITS_INTRO}</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {STUDENT_PREMIUM_BENEFITS_ITEMS.map((item) => (
          <li key={item} style={{ marginBottom: 8 }}>
            {item}
          </li>
        ))}
      </ul>
      <img
        src={koreezCoolSvgSrc()}
        alt=""
        width={96}
        height={96}
        style={{
          display: "block",
          marginTop: 20,
          marginLeft: "auto",
          marginRight: "auto",
          width: 96,
          height: 96,
          objectFit: "contain",
        }}
      />
    </div>
  );
}

// ── RULES (right Drawer on Board page) ──
function RulesDrawerContent() {
  const rules = [
    { icon: "🔼", text: <>Max <strong>1 task per class per day</strong>. Quality matters, not quantity.</> },
    { icon: "🔽", text: <>Min <strong>5 tasks per week</strong> required. You'll get a reminder if you miss this.</> },
    { icon: "⚖️", text: <>Teachers with 10 or 50 students score equally — it's all <strong>averages</strong>, not totals.</> },
    { icon: "🗓️", text: <>Scores run for the full <strong>academic year</strong> and reset in September.</> },
    { icon: "📅", text: <>Your <strong>tier updates weekly</strong> based on where you rank among all teachers.</> },
  ];

  const sectionTitleStyle = {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: `1px solid ${colors.border}`,
  };
  const sectionTitleTextStyle = {
    ...typoStrong("small"),
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.muted,
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        {/* Formula */}
        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <div style={{ ...typoStyle("large"), fontWeight: 600, color: colors.ink }}>Score = <span style={{ color: colors.blue }}>average grade across all students</span></div>
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4 }}>If a student doesn't complete the task, it counts as 0%</div>
        </div>

        {/* Example */}
        <div style={{ background: "#F0FAF0", border: "1px solid rgba(45,138,78,0.15)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ ...typoStyle("base"), fontWeight: 700, color: colors.ink, marginBottom: 8 }}>Example</div>
          <div style={{ ...typoStyle("small"), color: colors.text, lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 10px" }}>
              You have 14 students and assign one task. Six of them complete it with different percentage of correct answers. The other eight do not hand it in, so each of those counts as 0%.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              System adds every student&apos;s percentage (including all the zeros) calculates the average.
            </p>
            <p style={{ margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", ...typoStyle("small"), wordBreak: "break-word" }}>
              (90.2 + 85.6 + 76.5 + 88.1 + 12.3 + 44.9 + 0×8) ÷ 14 = 397.6 ÷ 14 = 28.4 points
            </p>
          </div>
        </div>

        {/* Rules */}
        {rules.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < rules.length - 1 ? `1px solid ${colors.border}` : "none", ...typoStyle("base"), color: colors.text }}>
            <span style={{ flexShrink: 0, width: 22, textAlign: "center", ...TYPO.base }}>{r.icon}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={sectionTitleStyle}>
          <div style={sectionTitleTextStyle}>Tiers</div>
        </div>

        {[
          { tier: "gold", text: "Top 10% of all teachers. Certificate of Excellence at year end." },
          { tier: "silver", text: "Top 40%. Certificate of Achievement at year end." },
          { tier: "bronze", text: "Building your score. Certificate of Participation at year end." },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < 2 ? `1px solid ${colors.border}` : "none", ...typoStyle("base"), color: colors.text }}>
            <span style={{ flexShrink: 0, width: 22, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <TierMedalImage tier={item.tier} height={20} style={{ maxWidth: 22 }} />
            </span>
            <span><strong>{TIER_CONFIG[item.tier].label}</strong> — {item.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** Progression / milestones — Home widget only. Weekly tier scoring stays in {@link RulesDrawerContent} on board view. */
function ProgressionRulesDrawerSection({ title, visual, children, isLast }) {
  const titleStyle = {
    ...typoStyle("large"),
    fontWeight: 700,
    color: colors.ink,
    marginBottom: 8,
    lineHeight: 1.35,
  };
  const bodyStyle = { ...typoStyle("base"), color: colors.text, margin: 0, lineHeight: 1.6 };
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        marginBottom: isLast ? 0 : 20,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 72,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: 2,
        }}
      >
        {visual}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{title}</div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}

function ProgressionRulesDrawerContent() {
  const rulesMedalVisual = (
    <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "nowrap" }}>
      <TierMedalImage tier="bronze" height={26} style={{ display: "block" }} />
      <TierMedalImage tier="silver" height={26} style={{ display: "block" }} />
      <TierMedalImage tier="gold" height={26} style={{ display: "block" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "inherit" }}>
      <ProgressionRulesDrawerSection title="Teacher medals" visual={rulesMedalVisual}>
        {PROGRESSION_RULES_TEACHER_MEDALS_PARAGRAPH}
      </ProgressionRulesDrawerSection>
      <ProgressionRulesDrawerSection
        title="Certificates"
        visual={<SafetyCertificateOutlined style={{ fontSize: 26, color: colors.blue }} aria-hidden />}
      >
        Each certified month advances the reward cycle (certificate; at months 2, 4, and 6 also bronze, silver, or gold student medal grants). Eligible students are counted at month end.
      </ProgressionRulesDrawerSection>
      <ProgressionRulesDrawerSection
        title="Ambassador"
        visual={(
          <img
            src={tierMedalAssetUrl("ambassador.svg")}
            alt=""
            width={28}
            height={28}
            style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
          />
        )}
      >
        {PROGRESSION_RULES_AMBASSADOR_PARAGRAPH}
      </ProgressionRulesDrawerSection>
      <ProgressionRulesDrawerSection
        title="Teacher of the Year"
        visual={(
          <img
            src={tierMedalAssetUrl("trophy.svg")}
            alt=""
            width={28}
            height={28}
            style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
          />
        )}
      >
        {PROGRESSION_RULES_TEACHER_OF_YEAR_PARAGRAPH}
      </ProgressionRulesDrawerSection>
      <ProgressionRulesDrawerSection
        title="Teacher points"
        visual={<LineChartOutlined style={{ fontSize: 26, color: colors.blue }} aria-hidden />}
      >
        {PROGRESSION_RULES_TEACHER_POINTS_CONTENT}
      </ProgressionRulesDrawerSection>
      <ProgressionRulesDrawerSection
        title="Tasks"
        visual={<CheckSquareOutlined style={{ fontSize: 26, color: colors.blue }} aria-hidden />}
        isLast
      >
        <>
          Up to <strong>1 task per class per day</strong>. Assign at least <strong>5 tasks per week</strong>.
        </>
      </ProgressionRulesDrawerSection>
    </div>
  );
}

function AchievementProgressFooter({ complete, fillRatio, fillColor, trackColor = "#E8ECF0" }) {
  if (complete) {
    return (
      <div style={{ paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckOutlined style={{ fontSize: 20, color: colors.green5 }} aria-label="Completed" />
      </div>
    );
  }
  const w = Math.max(0, Math.min(1, fillRatio));
  return (
    <div style={{ paddingTop: 16, width: "100%" }}>
      <div style={{ height: 4, borderRadius: 2, background: trackColor, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w * 100}%`, borderRadius: 2, background: fillColor, transition: "width 0.25s ease" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════

function TeacherAvatar({ size, alt = "", style = {}, ...imgProps }) {
  return (
    <img
      src={TEACHER_AVATAR_SRC}
      alt={alt}
      width={size}
      height={size}
      {...imgProps}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        display: "block",
        ...style,
      }}
    />
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24, marginBottom: 16, border: `1px solid ${colors.border}` }}>
      {title ? (
        <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ ...typoStrong("small"), textTransform: "uppercase", letterSpacing: 1.2, color: colors.muted }}>{title}</div>
          {subtitle ? (
            <div style={{
              ...typoStyle("small"),
              color: colors.text,
              lineHeight: 1.55,
              marginTop: 8,
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
            }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function MetricBox({ value, label }) {
  return (
    <div style={{ textAlign: "center", padding: "14px 8px", background: colors.bg, borderRadius: 8 }}>
      <div style={{ ...typoStyle("heading3"), fontWeight: 700, color: colors.ink }}>{value}</div>
      <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function TierProgressLadder({ tier, percentile }) {
  const pct = Math.min(99, Math.max(1, percentile));
  const tierInfo = TIER_CONFIG[tier];

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: "fit-content" }}>
        <div
          aria-hidden
          style={{
            display: "flex",
            marginBottom: TIER_LADDER_LABEL_GAP,
            width: "100%",
            lineHeight: `${TIER_LADDER_LABEL_LINE_HEIGHT}px`,
          }}
        >
          {TIER_LADDER_SEGMENTS.map((seg) => (
            <div
              key={`label-${seg.key}`}
              style={{
                flex: `${seg.flex} 1 0`,
                minWidth: 0,
                textAlign: "center",
                ...typoStrong("small"),
                color: colors.muted,
                letterSpacing: 0.2,
              }}
            >
              {TIER_CONFIG[seg.key].label}
            </div>
          ))}
        </div>

        <div
          role="img"
          aria-label="Tier scale: Bronze, then Silver, then Gold"
          style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: colors.border }}
        >
          {TIER_LADDER_SEGMENTS.map((seg) => (
            <div
              key={seg.key}
              style={{
                flex: `${seg.flex} 1 0`,
                minWidth: 0,
                background: seg.fill,
              }}
            />
          ))}
        </div>

        <div style={{ position: "relative", marginTop: 0, minHeight: 30, height: "fit-content", width: "100%" }}>
          <div
            role="status"
            aria-label={`Your tier: ${tierInfo.label}`}
            style={{
              position: "absolute",
              left: `${pct}%`,
              top: -TIER_LADDER_MARKER_OVERLAP_INTO_BAR,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <div
              aria-hidden
              style={{
                width: 2,
                height: 12,
                flexShrink: 0,
                background: colors.ink,
                borderRadius: 0,
                opacity: 0.7,
              }}
            />
            <TeacherAvatar size={28} alt="" aria-hidden={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single active-tier medal for compact layouts; home keeps full `TierMedalsInline`. */
function TierMedalCurrentOnly({ tier }) {
  const t = TIER_CONFIG[tier];
  return (
    <div
      role="img"
      aria-label={`Tier: ${t.label}`}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
    >
      <TierMedalImage tier={tier} height={48} style={{ userSelect: "none" }} />
    </div>
  );
}

function TierMedalsInline({ tier }) {
  const order = ["bronze", "silver", "gold"];
  const current = TIER_CONFIG[tier];
  return (
    <div
      role="img"
      aria-label={`Tier: ${current.label}`}
      style={{ display: "flex", alignItems: "center", gap: 4, lineHeight: 1 }}
    >
      {order.map((key) => (
        <div
          key={key}
          style={{
            lineHeight: 0,
            opacity: key === tier ? 1 : 0.3,
            transition: "opacity 0.2s ease",
            userSelect: "none",
          }}
        >
          <TierMedalImage tier={key} height={48} />
        </div>
      ))}
    </div>
  );
}

function TierBadge({ tier }) {
  const t = TIER_CONFIG[tier];
  return (
    <span style={{ ...typoStrong("small"), padding: "3px 10px", borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}`, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <TierMedalImage tier={tier} height={18} style={{ display: "block" }} />
      {t.label}
    </span>
  );
}

function WeeklyDots({ done, total }) {
  const doneGreen = "#52c41a";
  const greyBorder = "#C5CED6";
  const greyBg = "#F0F2F4";
  return (
    <div
      style={{ display: "flex", gap: 6, alignItems: "center", height: 16, paddingTop: 4 }}
      role="img"
      aria-label={`${done} of ${total} weekly tasks completed`}
    >
      {Array.from({ length: total }, (_, i) => {
        const checked = i < done;
        return (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 3,
              boxSizing: "border-box",
              border: checked ? `1px solid ${doneGreen}` : `1px solid ${greyBorder}`,
              background: checked ? doneGreen : greyBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden
          >
            {checked ? (
              <CheckOutlined
                style={{ fontSize: TYPO.small.fontSize, color: "white", display: "flex", justifyContent: "flex-start" }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StatBlock({ label, value, labelStyle, gap: columnGap = 0 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: columnGap,
        height: "fit-content",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <div style={{ ...typoStyle("heading5"), fontWeight: 700, color: colors.ink, display: "flex", alignItems: "center" }}>{value}</div>
      {label ? (
        <div
          style={{
            ...typoStyle("small"),
            color: colors.muted,
            fontWeight: 500,
            ...labelStyle,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

function LeaderboardRow({ rank, name, score, tier, isYou, rowRef, avatarSrc, school }) {
  return (
    <div
      ref={rowRef}
      style={{
        display: "flex", alignItems: "center", padding: "10px 0", gap: 12,
        borderTop: `1px solid ${colors.border}`,
        ...(isYou
          ? {
              backgroundColor: "rgba(232, 240, 250, 1)",
              margin: "4px -12px",
              padding: "8px 12px",
              borderRadius: 8,
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "none",
            }
          : {}),
      }}
    >
      <div style={{ width: 36, ...typoStyle("heading5"), fontWeight: 700, color: isYou ? colors.blue : colors.muted, textAlign: "center", flexShrink: 0 }}>{rank}</div>
      <img
        src={avatarSrc}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          background: colors.bg,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...typoStyle("base"), fontWeight: isYou ? 700 : 500, color: isYou ? colors.ink : colors.text }}>
          {name}
          {isYou && <span style={{ ...typoStyle("small"), fontWeight: 700, color: colors.blue, background: "white", padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>YOU</span>}
        </div>
        {school ? (
          <div style={{ ...typoStyle("small"), color: colors.muted, marginTop: 3, lineHeight: 1.35, fontWeight: 400 }}>{school}</div>
        ) : null}
      </div>
      <div style={{ ...typoStyle("heading5"), fontWeight: 700, color: colors.ink, flexShrink: 0 }}>{score}</div>
    </div>
  );
}
