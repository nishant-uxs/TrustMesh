export interface FeedbackNote {
  id: string;
  at: number;
  testerLabel: string;
  rating: number;
  liked: string;
  confusing: string;
  improve: string;
  request: string;
  comments: string;
}

const STORAGE_KEY = "tm-feedback-notes";
const MAX_NOTES = 100;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadFeedbackNotes(): FeedbackNote[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeedbackNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedbackNotes(notes: FeedbackNote[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(-MAX_NOTES)));
}

export function addFeedbackNote(
  input: Omit<FeedbackNote, "id" | "at"> & { at?: number },
): FeedbackNote {
  const note: FeedbackNote = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: input.at ?? Date.now(),
    testerLabel: input.testerLabel.trim() || "anonymous-tester",
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    liked: input.liked.trim(),
    confusing: input.confusing.trim(),
    improve: input.improve.trim(),
    request: input.request.trim(),
    comments: input.comments.trim(),
  };
  const next = [...loadFeedbackNotes(), note];
  saveFeedbackNotes(next);
  return note;
}

export function summarizeFeedback(notes: FeedbackNote[]) {
  const count = notes.length;
  const averageRating =
    count === 0 ? 0 : notes.reduce((sum, n) => sum + n.rating, 0) / count;
  return { count, averageRating };
}
