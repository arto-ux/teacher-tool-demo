import { useState, useMemo, useRef, useCallback } from "react";
import { TYPO, typoStyle, typoStrong, typoPageHeading } from "./typography-tokens.js";
import {
  Button,
  Modal,
  Input,
  Card,
  Tag,
  Space,
  Typography,
  Tooltip,
  message,
  Form,
  Empty,
  Tabs,
  Avatar,
  Dropdown,
} from "antd";
import {
  CopyOutlined,
  LikeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  StarFilled,
  CommentOutlined,
  LinkOutlined,
  TeamOutlined,
  MoreOutlined,
  PictureOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Text, Link } = Typography;

/** Kept on post objects for backwards compatibility; not shown in the UI. */
const DEFAULT_POST_CATEGORY = "general";

/** Collapsed post body preview length before “Read more”. */
const POST_BODY_PREVIEW_CHARS = 200;

const TEACHER_AVATAR_SRC = "/assets/images/Rectavatar_teacher.jpg";

/** TODO: replace with real invite token API */
const TEACHER_INVITE_BASE = "https://koreez.app/join/staff";

export const INVITE_BADGE_MIN = 10;

/** Star badge circle — matches Ant Design primary blue. */
const INVITE_STAR_BADGE_BG = "#1677ff";

const TIER_STYLES = {
  gold: { color: "#C5960C", bg: "#FDF8E8", border: "#E8D48A", label: "Gold" },
  silver: { color: "#6B7B8D", bg: "#EDF1F5", border: "#C5CED6", label: "Silver" },
  bronze: { color: "#9A6B3A", bg: "#F9F2EB", border: "#D4B896", label: "Bronze" },
};

/** Detect http(s) and www. URLs in comment text for inline links. */
const URL_IN_TEXT_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)'"\]]?)|(www\.[^\s<]+[^\s<.,;:!?)'"\]]?)/gi;

function linkifyCommentText(text) {
  if (!text) return null;
  const nodes = [];
  let last = 0;
  const re = new RegExp(URL_IN_TEXT_RE.source, "gi");
  let m;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const raw = m[0];
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    nodes.push(
      <Link key={`u-${k++}`} href={href} target="_blank" rel="noreferrer">
        {raw}
      </Link>,
    );
    last = m.index + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const APP_COLORS = {
  blue: "#2990FF",
  ink: "#1A1A2E",
  text: "#3D3D3D",
  muted: "#808080",
  border: "#E8ECF0",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  green: "#2D8A4E",
};

/** Rendered & preview size for images attached to posts or comments */
const FORUM_ATTACHMENT_IMAGE_STYLE = {
  maxWidth: "min(100%, 500px)",
  maxHeight: 300,
  width: "auto",
  height: "auto",
  objectFit: "contain",
  display: "block",
};

function staffAvatarSrc(rank, isYou) {
  if (isYou) return TEACHER_AVATAR_SRC;
  const i = ((rank - 1) % 10) + 1;
  return `/assets/images/${String(i).padStart(2, "0")}_teacher.png`;
}

function staffRowById(authorId) {
  return STAFF_AT_SCHOOL.find((s) => s.id === authorId);
}

function forumAvatarSrc(authorId, currentTeacherId) {
  const s = staffRowById(authorId);
  if (s) return staffAvatarSrc(s.rank, s.id === currentTeacherId);
  return TEACHER_AVATAR_SRC;
}

/** Invite count for forum badge: live count for signed-in user, else mock staff row. */
function forumInviteCountForAuthor(authorId, currentTeacherId, liveTeachersInvitedCount) {
  if (authorId === currentTeacherId) return liveTeachersInvitedCount;
  return staffRowById(authorId)?.teachersInvitedCount ?? 0;
}

export function buildTeacherInviteUrl() {
  const u = new URL(TEACHER_INVITE_BASE);
  u.searchParams.set("school", "Hayk Yeghazyan Educational Complex");
  return u.toString();
}

export function hasRecruiterBadge(count) {
  return count >= INVITE_BADGE_MIN;
}

/** School staff for Teachers Room grid (mock). */
export const STAFF_AT_SCHOOL = [
  { id: "staff-1", fullName: "Tigran Arakelyan", subjects: ["Mathematics", "Physics"], score: 94.2, rank: 1, tier: "gold", teachersInvitedCount: 11, isYou: false },
  { id: "staff-2", fullName: "Nare Hakobyan", subjects: ["English"], score: 93.8, rank: 2, tier: "gold", teachersInvitedCount: 7, isYou: false },
  { id: "staff-gayane", fullName: "Gayane Asatryan", subjects: ["Mathematics"], score: 88.9, rank: 3, tier: "gold", teachersInvitedCount: 6, isYou: true },
  { id: "staff-4", fullName: "Lilit Karapetyan", subjects: ["Biology", "Chemistry"], score: 84.0, rank: 4, tier: "silver", teachersInvitedCount: 0, isYou: false },
  { id: "staff-5", fullName: "Gor Mkrtchyan", subjects: ["History"], score: 81.2, rank: 5, tier: "silver", teachersInvitedCount: 5, isYou: false },
  { id: "staff-6", fullName: "Anahit Baghdasaryan", subjects: ["Armenian language"], score: 79.4, rank: 6, tier: "silver", teachersInvitedCount: 10, isYou: false },
  { id: "staff-7", fullName: "Elen Avetisyan", subjects: ["Music"], score: 77.1, rank: 7, tier: "silver", teachersInvitedCount: 12, isYou: false },
  { id: "staff-8", fullName: "Vardan Bejanian", subjects: ["PE"], score: 72.8, rank: 8, tier: "bronze", teachersInvitedCount: 1, isYou: false },
  { id: "staff-9", fullName: "Mane Grigoryan", subjects: ["Informatics"], score: 70.2, rank: 9, tier: "bronze", teachersInvitedCount: 5, isYou: false },
  { id: "staff-10", fullName: "Yana Avetisyan", subjects: ["Art"], score: 67.5, rank: 10, tier: "bronze", teachersInvitedCount: 4, isYou: false },
];

function makeComment(id, postId, authorId, authorName, body, overrides = {}) {
  return {
    id,
    postId,
    authorId,
    authorName,
    body,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: null,
    imageUrl: overrides.imageUrl ?? "",
    linkUrl: overrides.linkUrl ?? "",
    upvoteCount: overrides.upvoteCount ?? 1,
    upvotedByUserIds: overrides.upvotedByUserIds ?? [],
  };
}

function makePost(id, authorId, authorName, category, title, body, comments, overrides = {}) {
  return {
    id,
    authorId,
    authorName,
    category,
    title,
    body,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: null,
    imageUrl: overrides.imageUrl ?? "",
    linkUrl: overrides.linkUrl ?? "",
    upvoteCount: overrides.upvoteCount ?? 2,
    upvotedByUserIds: overrides.upvotedByUserIds ?? [],
    comments,
  };
}

export const FORUM_INITIAL_POSTS = [
  makePost(
    "post-1",
    "staff-2",
    "Nare Hakobyan",
    "best_practice",
    "Warm-up routine that actually works",
    "I start every lesson with a 3-minute retrieval quiz on last week’s topic — attendance and engagement both went up. Happy to share my slide template. I keep the questions short (one line each) and use the same deck every week so students know the routine. Struggling learners get a printed half-sheet with hints; everyone else works from the board. After the quiz we spend two minutes reviewing misconceptions, then move into the main lesson.\n\nIf anyone wants the Google Slides, I can drop a link. I’ve also started logging average scores in a simple sheet so I can see which topics need a second pass.",
    [
      makeComment("c1", "post-1", "staff-gayane", "Gayane Asatryan", "Trying this Monday — thanks for sharing!", {
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        upvoteCount: 3,
      }),
      makeComment("c2", "post-1", "staff-6", "Anahit Baghdasaryan", "Do you use the same format for oral vs written?", {
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      }),
    ],
    { createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), upvoteCount: 8 },
  ),
  makePost(
    "post-2",
    "staff-gayane",
    "Gayane Asatryan",
    "help",
    "Grading proofs — rubric advice?",
    "Looking for a simple rubric for short geometry proofs (grade 8). What columns do you use? My students can follow a two-column proof when we scaffold it together, but when I grade independent work I get inconsistent results — sometimes I reward neat layout, sometimes I focus on the key step. I’d like something I can share with students ahead of time so expectations are clear. Bonus question: do you weight diagrams, or only written reasoning? I’m trying to keep feedback under five minutes per student.",
    [
      makeComment("c3", "post-2", "staff-1", "Tigran Arakelyan", "We use clarity / reasoning / computation, 4 points each.", {
        linkUrl: "https://example.org/sample-rubric",
      }),
    ],
    { createdAt: new Date(Date.now() - 86400000).toISOString() },
  ),
  makePost(
    "post-3",
    "staff-7",
    "Elen Avetisyan",
    "urgent",
    "Exam room change — Building B",
    "Year-end oral exams moved to room 204 tomorrow 9:00. Please tell your classes. Building A is closed for maintenance on the ground floor, so all orals for Tuesday and Wednesday are consolidated in 204. Arrive five minutes early with your class lists; the door will be propped until 8:55. If you have a conflict with another exam block, message me today so we can swap slots. I’ll post an updated schedule in the staff channel by 6 p.m.",
    [],
    { createdAt: new Date(Date.now() - 7200000).toISOString(), upvoteCount: 14 },
  ),
];

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    message.success("Copied to clipboard");
  } catch {
    message.error("Could not copy — try selecting the link manually.");
  }
}

function inviteStarTooltipTitle(count) {
  return (
    <div style={{ maxWidth: 260 }}>
      <div style={{ ...typoStyle("base"), fontWeight: 600, marginBottom: 6 }}>Community builder</div>
      <div style={{ ...typoStyle("base") }}>
        This badge appears when a teacher has successfully invited <strong>{INVITE_BADGE_MIN} or more</strong> colleagues to join Koreez.
        This profile has <strong>{count}</strong> confirmed invites.
      </div>
    </div>
  );
}

const INVITE_STAR_BADGE_LAYOUT = {
  staff: { dim: 28, iconSize: TYPO.base.fontSize, offset: -4 },
  forumPost: { dim: 18, iconSize: TYPO.small.fontSize, offset: -2 },
  forumComment: { dim: 22, iconSize: TYPO.small.fontSize, offset: -2 },
};

/** White star on blue circle, bottom-right of avatar (10+ teacher invites). Hidden on the signed-in user’s staff card — they see progress in the invite banner instead. */
function InviteStarMark({ count, hideOnProfile, badgeSize = "staff" }) {
  if (hideOnProfile) return null;
  if (!hasRecruiterBadge(count)) return null;
  const { dim, iconSize, offset } = INVITE_STAR_BADGE_LAYOUT[badgeSize] ?? INVITE_STAR_BADGE_LAYOUT.staff;
  return (
    <Tooltip
      title={inviteStarTooltipTitle(count)}
      trigger={["hover", "focus", "click"]}
      mouseEnterDelay={0.15}
      destroyTooltipOnHide
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={`Community builder badge: ${INVITE_BADGE_MIN} or more teacher invites. Press for details.`}
        style={{
          position: "absolute",
          bottom: offset,
          right: offset,
          width: dim,
          height: dim,
          borderRadius: "50%",
          background: INVITE_STAR_BADGE_BG,
          border: "1px solid #FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          pointerEvents: "auto",
          cursor: "help",
          outline: "none",
        }}
      >
        <StarFilled style={{ color: "#FFFFFF", fontSize: iconSize }} aria-hidden />
      </span>
    </Tooltip>
  );
}

function ForumAuthorRow({ authorId, authorName, currentTeacherId, liveTeachersInvitedCount, size, dateLine }) {
  const avatarPx = size === "post" ? 40 : 32;
  const src = forumAvatarSrc(authorId, currentTeacherId);
  const count = forumInviteCountForAuthor(authorId, currentTeacherId, liveTeachersInvitedCount);
  const isComment = size === "comment";
  const starBadgeSize = isComment ? "forumComment" : "forumPost";
  const alignItems = dateLine ? "flex-start" : "center";

  return (
    <div style={{ display: "flex", alignItems, gap: 10, minWidth: 0 }}>
      <div style={{ position: "relative", width: avatarPx, height: avatarPx, flexShrink: 0 }}>
        <img
          src={src}
          alt={authorName}
          style={{
            width: avatarPx,
            height: avatarPx,
            borderRadius: "50%",
            objectFit: "cover",
            border: `1px solid ${APP_COLORS.border}`,
            display: "block",
            background: APP_COLORS.bg,
          }}
        />
        <InviteStarMark count={count} hideOnProfile={false} badgeSize={starBadgeSize} />
      </div>
      <div style={{ minWidth: 0, flex: dateLine ? 1 : undefined }}>
        <Text strong style={{ color: APP_COLORS.ink, ...typoStyle("base"), display: "block" }}>
          {authorName}
        </Text>
        {dateLine ? (
          <Text type="secondary" style={{ ...typoStyle("small"), lineHeight: 1.4, display: "block", marginTop: 2 }}>
            {dateLine}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

/** Mock colleagues who joined via your invite link (demo — first N shown by count). */
const INVITE_JOINED_PREVIEW_IDS = ["staff-2", "staff-6", "staff-1", "staff-4", "staff-5", "staff-7"];

function InviteeAvatarStack({ teachersInvitedCount }) {
  const n = Math.max(0, Math.floor(teachersInvitedCount ?? 0));
  const label = `${n} ${n === 1 ? "teacher" : "teachers"} joined from your invite`;

  return (
    <div
      style={{ display: "flex", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${APP_COLORS.border}`, flexWrap: "wrap", gap: "8px 0" }}
      aria-label={label}
    >
      <div style={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
        {INVITE_JOINED_PREVIEW_IDS.map((id, j) => {
          const s = staffRowById(id);
          const src = s ? staffAvatarSrc(s.rank, false) : TEACHER_AVATAR_SRC;
          return (
            <Avatar
              key={id}
              src={src}
              size={36}
              alt=""
              style={{
                border: "1px solid #FFFFFF",
                marginLeft: j === 0 ? 0 : -12,
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      <Text type="secondary" style={{ ...typoStyle("small"), marginLeft: 10, lineHeight: 1.4 }}>
        {label}
      </Text>
    </div>
  );
}

function InviteCommunityBlock({ teachersInvitedCount, onInvite }) {
  const goal = INVITE_BADGE_MIN;
  const progress = Math.min(teachersInvitedCount / goal, 1);
  const completed = teachersInvitedCount >= goal;
  const ringSize = 64;
  const stroke = 4;
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);
  const fillOpacity = completed ? 1 : 0.3;

  return (
    <div
      style={{
        background: APP_COLORS.card,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            position: "relative",
            width: ringSize,
            height: ringSize,
            flexShrink: 0,
          }}
          aria-hidden
        >
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            style={{ position: "absolute", left: 0, top: 0, transform: "rotate(-90deg)" }}
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              fill="none"
              stroke={APP_COLORS.border}
              strokeWidth={stroke}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              fill="none"
              stroke={INVITE_STAR_BADGE_BG}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.45s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 46,
              height: 46,
              borderRadius: "50%",
              border: "1px solid #FFFFFF",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: INVITE_STAR_BADGE_BG,
                opacity: fillOpacity,
                transition: "opacity 0.35s ease",
              }}
            />
            <StarFilled style={{ color: "#FFFFFF", fontSize: TYPO.heading4.fontSize, position: "relative", zIndex: 1 }} />
          </div>
        </div>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div style={{ ...typoStyle("heading5"), fontWeight: 700, color: APP_COLORS.ink, marginBottom: 4 }}>
            Build your community
          </div>
          <Text type="secondary" style={{ ...typoStyle("base"), display: "block" }}>
            Invite at least 10 colleagues and get rewarded.
          </Text>
        </div>
        <Button type="primary" icon={<GiftOutlined />} onClick={onInvite} style={{ borderRadius: 8, fontWeight: 400, flexShrink: 0 }}>
          Invite
        </Button>
      </div>
      <InviteeAvatarStack teachersInvitedCount={teachersInvitedCount} />
    </div>
  );
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TeachersRoomPage({ currentTeacherId, currentTeacherName, teachersInvitedCount }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [posts, setPosts] = useState(() =>
    FORUM_INITIAL_POSTS.map((p) => ({
      ...p,
      comments: p.comments.map((c) => ({ ...c, upvotedByUserIds: [...c.upvotedByUserIds] })),
      upvotedByUserIds: [...p.upvotedByUserIds],
    })),
  );
  const [search, setSearch] = useState("");

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postForm] = Form.useForm();
  /** Attached image for new/edit post (data URL or existing post image URL). */
  const [postModalImageUrl, setPostModalImageUrl] = useState("");

  const [expandedPostId, setExpandedPostId] = useState(null);
  /** Full post body visible (separate from comments thread). */
  const [bodyExpandedByPostId, setBodyExpandedByPostId] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentForms, setCommentForms] = useState({});
  const [editingComment, setEditingComment] = useState(null);

  const inviteUrl = useMemo(() => buildTeacherInviteUrl(), []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!`${p.title} ${p.body} ${p.authorName}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [posts, search]);

  const handlePostModalImage = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.warning("Please choose an image file");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      message.warning("Image must be under 2.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPostModalImageUrl(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const openNewPost = () => {
    setEditingPostId(null);
    setPostModalImageUrl("");
    postForm.resetFields();
    postForm.setFieldsValue({ title: "", body: "" });
    setPostModalOpen(true);
  };

  const openEditPost = (post) => {
    setEditingPostId(post.id);
    setPostModalImageUrl(post.imageUrl || "");
    postForm.setFieldsValue({
      title: post.title,
      body: post.body,
    });
    setPostModalOpen(true);
  };

  const savePost = () =>
    postForm.validateFields(["title", "body"]).then((v) => {
      const bodyText = (v.body || "").trim();
      if (!bodyText && !postModalImageUrl) {
        message.warning("Write a message or attach an image");
        return Promise.reject(new Error("message or image required"));
      }
      if (editingPostId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingPostId
              ? {
                  ...p,
                  title: v.title,
                  body: v.body,
                  imageUrl: postModalImageUrl || "",
                  linkUrl: "",
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
        message.success("Post updated");
      } else {
        const newPost = makePost(
          uid("post"),
          currentTeacherId,
          currentTeacherName,
          DEFAULT_POST_CATEGORY,
          v.title,
          v.body,
          [],
          {
            imageUrl: postModalImageUrl || "",
            linkUrl: "",
            upvoteCount: 0,
            upvotedByUserIds: [],
          },
        );
        setPosts((prev) => [newPost, ...prev]);
        message.success("Post published");
      }
      setPostModalImageUrl("");
      setPostModalOpen(false);
    });

  const deletePost = (postId) => {
    Modal.confirm({
      title: "Delete this post?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (expandedPostId === postId) setExpandedPostId(null);
        setBodyExpandedByPostId((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
        message.success("Post deleted");
      },
    });
  };

  const togglePostVote = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const set = new Set(p.upvotedByUserIds);
        if (set.has(currentTeacherId)) {
          set.delete(currentTeacherId);
          return { ...p, upvotedByUserIds: [...set], upvoteCount: Math.max(0, p.upvoteCount - 1) };
        }
        set.add(currentTeacherId);
        return { ...p, upvotedByUserIds: [...set], upvoteCount: p.upvoteCount + 1 };
      }),
    );
  };

  const toggleCommentVote = (postId, commentId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== commentId) return c;
            const set = new Set(c.upvotedByUserIds);
            if (set.has(currentTeacherId)) {
              set.delete(currentTeacherId);
              return { ...c, upvotedByUserIds: [...set], upvoteCount: Math.max(0, c.upvoteCount - 1) };
            }
            set.add(currentTeacherId);
            return { ...c, upvotedByUserIds: [...set], upvoteCount: c.upvoteCount + 1 };
          }),
        };
      }),
    );
  };

  const handleNewCommentImage = useCallback((postId, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.warning("Please choose an image file");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      message.warning("Image must be under 2.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCommentDrafts((d) => ({
        ...d,
        [postId]: { body: d[postId]?.body ?? "", imageUrl: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleEditCommentImage = useCallback((commentId, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.warning("Please choose an image file");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      message.warning("Image must be under 2.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCommentForms((f) => {
        const cur = f[commentId] || { body: "", imageUrl: "" };
        return { ...f, [commentId]: { ...cur, imageUrl: reader.result } };
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const addComment = (postId) => {
    const draft = commentDrafts[postId] || { body: "", imageUrl: "" };
    if (!draft.body.trim() && !draft.imageUrl) {
      message.warning("Write a comment or attach an image");
      return;
    }
    const comment = makeComment(uid("c"), postId, currentTeacherId, currentTeacherName, draft.body.trim(), {
      imageUrl: draft.imageUrl || "",
      linkUrl: "",
      upvoteCount: 0,
      upvotedByUserIds: [],
    });
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
    setCommentDrafts((d) => ({ ...d, [postId]: { body: "", imageUrl: "" } }));
    message.success("Comment added");
  };

  const saveEditedComment = (postId, commentId, body, imageUrl) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map((c) =>
            c.id === commentId
              ? { ...c, body, imageUrl: imageUrl || "", linkUrl: "", updatedAt: new Date().toISOString() }
              : c,
          ),
        };
      }),
    );
    setEditingComment(null);
    message.success("Comment updated");
  };

  const deleteComment = (postId, commentId) => {
    Modal.confirm({
      title: "Delete this comment?",
      okType: "danger",
      okText: "Delete",
      onOk: () => {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)),
        );
        message.success("Comment deleted");
      },
    });
  };

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="koreez-page-heading" style={{ margin: 0, ...typoPageHeading(), color: APP_COLORS.ink }}>
          Teachers Room
        </h1>
      </div>

      <InviteCommunityBlock teachersInvitedCount={teachersInvitedCount} onInvite={() => setInviteOpen(true)} />

      <Tabs
        defaultActiveKey="forum"
        items={[
          {
            key: "forum",
            label: (
              <span>
                <CommentOutlined /> Forum
              </span>
            ),
            children: (
              <>
                <Text type="secondary" style={{ ...typoStyle("base"), margin: "0 0 12px", display: "block" }}>
                  Questions, ideas, and updates from colleagues at your school.
                </Text>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={openNewPost}>
                    New post
                  </Button>
                  <Input.Search
                    allowClear
                    placeholder="Search posts…"
                    onSearch={setSearch}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 330, maxWidth: "100%" }}
                  />
                </div>

                {filteredPosts.length === 0 ? (
                  <Empty description="No posts match your filters" />
                ) : (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {filteredPosts.map((post) => {
                      const commentsOpen = expandedPostId === post.id;
                      const bodyExpanded = !!bodyExpandedByPostId[post.id];
                      const voted = post.upvotedByUserIds.includes(currentTeacherId);
                      const isOwner = post.authorId === currentTeacherId;
                      const isLongBody = post.body.length > POST_BODY_PREVIEW_CHARS;
                      const showFullBody = bodyExpanded || !isLongBody;
                      const showAttachments = commentsOpen || bodyExpanded || !isLongBody;
                      return (
                        <Card
                          key={post.id}
                          size="small"
                          style={{ borderRadius: 10, border: `1px solid ${APP_COLORS.border}` }}
                          styles={{ body: { padding: 24 } }}
                        >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ForumAuthorRow
                      authorId={post.authorId}
                      authorName={post.authorName}
                      currentTeacherId={currentTeacherId}
                      liveTeachersInvitedCount={teachersInvitedCount}
                      size="post"
                      dateLine={`${dayjs(post.createdAt).format("MMM D, YYYY HH:mm")}${post.updatedAt ? " · edited" : ""}`}
                    />
                  </div>
                  {isOwner ? (
                    <Dropdown
                      trigger={["click"]}
                      getPopupContainer={() => document.body}
                      menu={{
                        items: [
                          { key: "edit", label: "Edit post", icon: <EditOutlined /> },
                          { key: "delete", label: "Delete", icon: <DeleteOutlined />, danger: true },
                        ],
                        onClick: ({ key, domEvent }) => {
                          domEvent.stopPropagation();
                          if (key === "edit") openEditPost(post);
                          if (key === "delete") deletePost(post.id);
                        },
                      }}
                    >
                      <Button type="text" icon={<MoreOutlined style={{ fontSize: TYPO.heading4.fontSize }} />} aria-label="Post actions" style={{ flexShrink: 0, color: APP_COLORS.muted }} />
                    </Dropdown>
                  ) : null}
                </div>
                <div style={{ ...typoStyle("heading5"), fontWeight: 700, color: APP_COLORS.ink, marginTop: 12, marginBottom: 8 }}>{post.title}</div>
                {!showFullBody ? (
                  <>
                    <div style={{ ...typoStyle("base"), color: APP_COLORS.text, whiteSpace: "pre-wrap" }}>
                      {post.body.slice(0, POST_BODY_PREVIEW_CHARS)}…
                    </div>
                    <Button
                      type="link"
                      style={{ paddingLeft: 0, height: "auto", marginTop: 4 }}
                      onClick={() => setBodyExpandedByPostId((prev) => ({ ...prev, [post.id]: true }))}
                    >
                      Read more
                    </Button>
                  </>
                ) : (
                  <>
                    <div style={{ ...typoStyle("base"), color: APP_COLORS.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {linkifyCommentText(post.body)}
                    </div>
                    {isLongBody ? (
                      <Button
                        type="link"
                        style={{ paddingLeft: 0, height: "auto", marginTop: 4 }}
                        onClick={() =>
                          setBodyExpandedByPostId((prev) => {
                            const next = { ...prev };
                            delete next[post.id];
                            return next;
                          })
                        }
                      >
                        Read less
                      </Button>
                    ) : null}
                  </>
                )}
                {showAttachments && post.imageUrl ? (
                  <img src={post.imageUrl} alt="" style={{ ...FORUM_ATTACHMENT_IMAGE_STYLE, marginTop: 12, borderRadius: 8 }} />
                ) : null}
                {showAttachments && post.linkUrl ? (
                  <div style={{ marginTop: 8 }}>
                    <Link href={post.linkUrl} target="_blank" rel="noreferrer">
                      <LinkOutlined /> {post.linkUrl}
                    </Link>
                  </div>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <Button
                    type={voted ? "primary" : "default"}
                    size="small"
                    icon={<LikeOutlined />}
                    aria-label={voted ? "Remove upvote" : "Upvote post"}
                    onClick={() => togglePostVote(post.id)}
                  >
                    {post.upvoteCount}
                  </Button>
                  <Button
                    type="default"
                    size="small"
                    icon={<CommentOutlined />}
                    onClick={() => setExpandedPostId(commentsOpen ? null : post.id)}
                  >
                    {commentsOpen ? "Hide comments" : "View comments"} · {post.comments.length}
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: "0 4px", height: "auto", color: INVITE_STAR_BADGE_BG, fontWeight: 500 }}
                    onClick={() => {
                      setExpandedPostId(post.id);
                      requestAnimationFrame(() => {
                        document.getElementById(`forum-comment-${post.id}`)?.focus();
                      });
                    }}
                  >
                    Comment
                  </Button>
                </div>

                {commentsOpen ? (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${APP_COLORS.border}` }}>
                    <Text strong style={{ ...typoStyle("base") }}>
                      Comments
                    </Text>
                    <Space direction="vertical" size={10} style={{ width: "100%", marginTop: 12 }}>
                      {post.comments.map((c) => {
                        const cvoted = c.upvotedByUserIds.includes(currentTeacherId);
                        const cOwner = c.authorId === currentTeacherId;
                        const editing = editingComment?.postId === post.id && editingComment?.commentId === c.id;
                        if (editing) {
                          const init = commentForms[c.id] || { body: c.body, imageUrl: c.imageUrl || "" };
                          const editVal = commentForms[c.id] || init;
                          return (
                            <Card key={c.id} size="small" style={{ background: APP_COLORS.bg }}>
                              <div
                                style={{
                                  border: `1px solid ${APP_COLORS.border}`,
                                  borderRadius: 8,
                                  background: APP_COLORS.card,
                                  overflow: "hidden",
                                }}
                              >
                                <TextArea
                                  id={`forum-comment-edit-${c.id}`}
                                  variant="borderless"
                                  autoSize={{ minRows: 2, maxRows: 8 }}
                                  placeholder="Edit comment… Paste links in your message."
                                  value={editVal.body}
                                  onChange={(e) =>
                                    setCommentForms((f) => ({
                                      ...f,
                                      [c.id]: { ...(f[c.id] || init), body: e.target.value },
                                    }))
                                  }
                                  style={{ padding: "10px 12px" }}
                                />
                                {editVal.imageUrl ? (
                                  <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                                    <img src={editVal.imageUrl} alt="" style={{ ...FORUM_ATTACHMENT_IMAGE_STYLE, borderRadius: 6 }} />
                                    <Button
                                      type="link"
                                      danger
                                      size="small"
                                      style={{ padding: 0, height: "auto" }}
                                      onClick={() =>
                                        setCommentForms((f) => ({
                                          ...f,
                                          [c.id]: { ...(f[c.id] || init), imageUrl: "" },
                                        }))
                                      }
                                    >
                                      Remove image
                                    </Button>
                                  </div>
                                ) : null}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 10px",
                                    borderTop: `1px solid ${APP_COLORS.border}`,
                                    background: APP_COLORS.bg,
                                  }}
                                >
                                  <Tooltip title="Attach image">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<PictureOutlined />}
                                      aria-label="Attach image"
                                      onClick={() => document.getElementById(`forum-comment-edit-file-${c.id}`)?.click()}
                                    />
                                  </Tooltip>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id={`forum-comment-edit-file-${c.id}`}
                                    style={{ display: "none" }}
                                    onChange={(e) => handleEditCommentImage(c.id, e)}
                                  />
                                  <Space size={8}>
                                    <Button type="link" size="small" style={{ color: INVITE_STAR_BADGE_BG, fontWeight: 600 }} onClick={() => saveEditedComment(post.id, c.id, editVal.body, editVal.imageUrl)}>
                                      Save
                                    </Button>
                                    <Button type="link" size="small" onClick={() => setEditingComment(null)}>
                                      Cancel
                                    </Button>
                                  </Space>
                                </div>
                              </div>
                            </Card>
                          );
                        }
                        return (
                          <Card key={c.id} size="small" style={{ background: APP_COLORS.bg }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                                <ForumAuthorRow
                                  authorId={c.authorId}
                                  authorName={c.authorName}
                                  currentTeacherId={currentTeacherId}
                                  liveTeachersInvitedCount={teachersInvitedCount}
                                  size="comment"
                                />
                                {cOwner ? (
                                  <Dropdown
                                    trigger={["click"]}
                                    getPopupContainer={() => document.body}
                                    menu={{
                                      items: [
                                        { key: "edit", label: "Edit comment", icon: <EditOutlined /> },
                                        { key: "delete", label: "Delete", icon: <DeleteOutlined />, danger: true },
                                      ],
                                      onClick: ({ key, domEvent }) => {
                                        domEvent.stopPropagation();
                                        if (key === "edit") {
                                          setCommentForms((f) => ({
                                            ...f,
                                            [c.id]: { body: c.body, imageUrl: c.imageUrl || "" },
                                          }));
                                          setEditingComment({ postId: post.id, commentId: c.id });
                                        }
                                        if (key === "delete") deleteComment(post.id, c.id);
                                      },
                                    }}
                                  >
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<MoreOutlined style={{ fontSize: TYPO.large.fontSize }} />}
                                      aria-label="Comment actions"
                                      style={{ flexShrink: 0, color: APP_COLORS.muted, marginTop: -2 }}
                                    />
                                  </Dropdown>
                                ) : null}
                              </div>
                              <Text type="secondary" style={{ ...typoStyle("small"), display: "block", marginBottom: 6 }}>
                                {dayjs(c.createdAt).format("MMM D, YYYY HH:mm")}
                                {c.updatedAt ? " · edited" : ""}
                              </Text>
                              <div style={{ ...typoStyle("base"), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{linkifyCommentText(c.body)}</div>
                              {c.imageUrl ? <img src={c.imageUrl} alt="" style={{ ...FORUM_ATTACHMENT_IMAGE_STYLE, marginTop: 8, borderRadius: 6 }} /> : null}
                              {c.linkUrl ? (
                                <div style={{ marginTop: 6 }}>
                                  <Link href={c.linkUrl} target="_blank" rel="noreferrer" style={{ ...typoStyle("base") }}>
                                    {c.linkUrl}
                                  </Link>
                                </div>
                              ) : null}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 8,
                                  marginTop: 12,
                                }}
                              >
                                <Button
                                  type={cvoted ? "primary" : "default"}
                                  size="small"
                                  icon={<LikeOutlined />}
                                  aria-label={cvoted ? "Remove upvote" : "Upvote comment"}
                                  onClick={() => toggleCommentVote(post.id, c.id)}
                                >
                                  {c.upvoteCount}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </Space>
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          border: `1px solid ${APP_COLORS.border}`,
                          borderRadius: 8,
                          background: APP_COLORS.card,
                          overflow: "hidden",
                        }}
                      >
                        <TextArea
                          id={`forum-comment-${post.id}`}
                          variant="borderless"
                          autoSize={{ minRows: 2, maxRows: 8 }}
                          placeholder="Write a comment… You can paste links in your message."
                          value={commentDrafts[post.id]?.body ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((d) => ({
                              ...d,
                              [post.id]: { imageUrl: d[post.id]?.imageUrl ?? "", body: e.target.value },
                            }))
                          }
                          style={{ padding: "10px 12px" }}
                        />
                        {commentDrafts[post.id]?.imageUrl ? (
                          <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <img src={commentDrafts[post.id].imageUrl} alt="" style={{ ...FORUM_ATTACHMENT_IMAGE_STYLE, borderRadius: 6 }} />
                            <Button
                              type="link"
                              danger
                              size="small"
                              style={{ padding: 0, height: "auto" }}
                              onClick={() =>
                                setCommentDrafts((d) => ({
                                  ...d,
                                  [post.id]: { body: d[post.id]?.body ?? "", imageUrl: "" },
                                }))
                              }
                            >
                              Remove image
                            </Button>
                          </div>
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            borderTop: `1px solid ${APP_COLORS.border}`,
                            background: APP_COLORS.bg,
                          }}
                        >
                          <Tooltip title="Attach image">
                            <Button
                              type="text"
                              size="small"
                              icon={<PictureOutlined />}
                              aria-label="Attach image"
                              onClick={() => document.getElementById(`forum-comment-file-${post.id}`)?.click()}
                            />
                          </Tooltip>
                          <input
                            type="file"
                            accept="image/*"
                            id={`forum-comment-file-${post.id}`}
                            style={{ display: "none" }}
                            onChange={(e) => handleNewCommentImage(post.id, e)}
                          />
                          <Button type="link" size="small" style={{ color: INVITE_STAR_BADGE_BG, fontWeight: 600 }} onClick={() => addComment(post.id)}>
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                        </Card>
                      );
                    })}
                  </Space>
                )}
              </>
            ),
          },
          {
            key: "staff",
            label: (
              <span>
                <TeamOutlined /> School staff
              </span>
            ),
            children: (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 16,
                    overflow: "visible",
                  }}
                >
                  {STAFF_AT_SCHOOL.map((s) => {
                    const tier = TIER_STYLES[s.tier] || TIER_STYLES.bronze;
                    return (
                      <Card
                        key={s.id}
                        size="small"
                        styles={{ body: { padding: 16, overflow: "visible" } }}
                        style={{ borderRadius: 12, border: `1px solid ${APP_COLORS.border}`, overflow: "visible" }}
                      >
                        <div style={{ display: "flex", gap: 14 }}>
                          <div
                            style={{
                              position: "relative",
                              width: 100,
                              height: 100,
                              flexShrink: 0,
                              overflow: "visible",
                            }}
                          >
                            <img
                              src={staffAvatarSrc(s.rank, s.isYou)}
                              alt=""
                              width={100}
                              height={100}
                              style={{ borderRadius: 10, objectFit: "cover", display: "block" }}
                            />
                            <InviteStarMark count={s.teachersInvitedCount} hideOnProfile={s.isYou} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                gap: 4,
                                marginTop: 8,
                                marginBottom: 4,
                              }}
                            >
                              <Text strong style={{ ...typoStyle("large"), color: APP_COLORS.ink, lineHeight: 1.3 }}>
                                {s.fullName}
                              </Text>
                            </div>
                            <div style={{ ...typoStyle("small"), color: APP_COLORS.muted, marginBottom: 8 }}>
                              {s.subjects.join(" · ")}
                            </div>
                            <Tag
                              style={{
                                marginTop: 8,
                                color: tier.color,
                                background: tier.bg,
                                borderColor: tier.border,
                              }}
                            >
                              {tier.label}
                            </Tag>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ),
          },
        ]}
      />

      <Modal
        title="Invite a colleague"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        width={520}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => copyTextToClipboard(inviteUrl)}>
            Copy link
          </Button>,
          <Button key="close" onClick={() => setInviteOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <p style={{ ...typoStyle("base"), color: APP_COLORS.muted, marginTop: 0 }}>
          Share this link with teachers you want to join Koreez at your school.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            padding: 12,
            background: APP_COLORS.card,
            borderRadius: 8,
            border: `1px solid ${APP_COLORS.border}`,
          }}
        >
          <span style={{ ...typoStrong("small"), color: APP_COLORS.text }}>Scan to open</span>
          <img
            src="/assets/images/qr-code.png"
            alt="QR code for the colleague invite link"
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
            background: APP_COLORS.bg,
            borderRadius: 8,
            border: `1px solid ${APP_COLORS.border}`,
            marginBottom: 0,
          }}
        >
          {inviteUrl}
        </div>
      </Modal>

      <Modal
        title={editingPostId ? "Edit post" : "New post"}
        open={postModalOpen}
        onCancel={() => {
          setPostModalOpen(false);
          setPostModalImageUrl("");
        }}
        onOk={() => savePost()}
        okText={editingPostId ? "Save" : "Publish"}
        width={560}
        destroyOnClose
      >
        <Form form={postForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input maxLength={200} showCount />
          </Form.Item>
          <Form.Item label="Message" required>
            <div
              style={{
                border: `1px solid ${APP_COLORS.border}`,
                borderRadius: 8,
                background: APP_COLORS.card,
                overflow: "hidden",
              }}
            >
              <Form.Item name="body" noStyle>
                <TextArea
                  variant="borderless"
                  autoSize={{ minRows: 4, maxRows: 14 }}
                  maxLength={8000}
                  showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                  placeholder="Write your post… You can paste links in your message."
                  style={{ padding: "10px 12px" }}
                />
              </Form.Item>
              {postModalImageUrl ? (
                <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <img src={postModalImageUrl} alt="" style={{ ...FORUM_ATTACHMENT_IMAGE_STYLE, borderRadius: 6 }} />
                  <Button type="link" danger size="small" style={{ padding: 0, height: "auto" }} onClick={() => setPostModalImageUrl("")}>
                    Remove image
                  </Button>
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 10px",
                  borderTop: `1px solid ${APP_COLORS.border}`,
                  background: APP_COLORS.bg,
                }}
              >
                <Tooltip title="Attach image">
                  <Button
                    type="text"
                    size="small"
                    icon={<PictureOutlined />}
                    aria-label="Attach image"
                    onClick={() => document.getElementById("forum-post-modal-file")?.click()}
                  />
                </Tooltip>
                <input
                  type="file"
                  accept="image/*"
                  id="forum-post-modal-file"
                  style={{ display: "none" }}
                  onChange={handlePostModalImage}
                />
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
