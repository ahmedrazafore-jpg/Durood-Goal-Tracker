import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  collection,
  query,
  where,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import {
  CampaignDocument,
  CampaignStats,
  SubmissionItem,
  JamiaClass,
  StudentPerformance,
} from '../types';

export const CAMPAIGN_COLLECTION = 'campaign';
export const SUBMISSIONS_COLLECTION = 'submissions';
export const INITIAL_MAIN_DOC_ID = 'main';

export const DEFAULT_CAMPAIGN_DOC: CampaignDocument = {
  id: INITIAL_MAIN_DOC_ID,
  title: 'ربیع الاول درودِ پاک مہم — جامعۃ المدینہ عطار منزل',
  target: 0,
  totalRecited: 0,
  remaining: 0,
  progressPercentage: 0,
  startDate: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  durationDays: 12,
  endDate: '2026-09-15',
  endTime: '08:00',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export type CampaignScheduleStatus = 'upcoming' | 'active' | 'expired';

export interface CampaignScheduleInfo {
  status: CampaignScheduleStatus;
  statusLabelUrdu: string;
  isAcceptingSubmissions: boolean;
  startDateTime: Date;
  endDateTime: Date;
  daysRemaining: number;
  hoursRemaining: number;
  totalDurationDays: number;
  formattedStartUrdu: string;
  formattedEndUrdu: string;
  timeStatusTextUrdu: string;
}

/**
 * Calculates start Date, end Date, and auto-computed schedule status from campaign document.
 */
export function calculateCampaignSchedule(campaign?: Partial<CampaignDocument> | null): CampaignScheduleInfo {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Resolve start date & time
  const startDateStr = campaign?.startDate || todayStr;
  const startTimeStr = campaign?.startTime || '08:00';
  const cleanStartTime = startTimeStr.length === 5 ? `${startTimeStr}:00` : startTimeStr;

  let startDateTime = new Date(`${startDateStr}T${cleanStartTime}`);
  if (isNaN(startDateTime.getTime())) {
    startDateTime = new Date(`${startDateStr}T08:00:00`);
    if (isNaN(startDateTime.getTime())) {
      startDateTime = now;
    }
  }

  // 2. Resolve duration in days
  let durationDays = campaign?.durationDays;
  if (!durationDays || durationDays <= 0) {
    if (campaign?.endDate) {
      const cleanEndTime = (campaign.endTime || startTimeStr).length === 5 ? `${campaign.endTime || startTimeStr}:00` : (campaign.endTime || startTimeStr);
      const endParsed = new Date(`${campaign.endDate}T${cleanEndTime}`);
      if (!isNaN(endParsed.getTime()) && endParsed.getTime() > startDateTime.getTime()) {
        const diffMs = endParsed.getTime() - startDateTime.getTime();
        durationDays = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));
      } else {
        durationDays = 12;
      }
    } else {
      durationDays = 12;
    }
  }

  // 3. Resolve end date & time
  let endDateTime: Date;
  if (campaign?.endDate) {
    const endTimeStr = campaign?.endTime || startTimeStr;
    const cleanEndTime = endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr;
    const endParsed = new Date(`${campaign.endDate}T${cleanEndTime}`);
    if (!isNaN(endParsed.getTime())) {
      endDateTime = endParsed;
    } else {
      endDateTime = new Date(startDateTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }
  } else {
    endDateTime = new Date(startDateTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  // 4. Status determination
  let status: CampaignScheduleStatus = 'active';
  let isAcceptingSubmissions = true;
  let statusLabelUrdu = 'مہم جاری ہے';
  let timeStatusTextUrdu = '';
  let daysRemaining = 0;
  let hoursRemaining = 0;

  const nowMs = now.getTime();
  const startMs = startDateTime.getTime();
  const endMs = endDateTime.getTime();

  if (nowMs < startMs) {
    status = 'upcoming';
    isAcceptingSubmissions = false;
    statusLabelUrdu = 'آنے والی مہم';
    const diffMs = startMs - nowMs;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (diffDays > 0) {
      timeStatusTextUrdu = `آغاز میں ${diffDays} دن اور ${diffHours} گھنٹے باقی`;
    } else {
      timeStatusTextUrdu = `آغاز میں ${Math.max(1, diffHours)} گھنٹے باقی`;
    }
  } else if (nowMs > endMs) {
    status = 'expired';
    isAcceptingSubmissions = false;
    statusLabelUrdu = 'مہم ختم ہو چکی ہے';
    timeStatusTextUrdu = 'مقررہ وقت مکمل ہو چکا ہے';
  } else {
    status = 'active';
    isAcceptingSubmissions = true;
    statusLabelUrdu = 'مہم جاری ہے';
    const diffMs = endMs - nowMs;
    daysRemaining = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    hoursRemaining = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (daysRemaining > 0) {
      timeStatusTextUrdu = `${daysRemaining} دن ${hoursRemaining > 0 ? `اور ${hoursRemaining} گھنٹے ` : ''}باقی`;
    } else {
      timeStatusTextUrdu = `${Math.max(1, hoursRemaining)} گھنٹے باقی`;
    }
  }

  const formatUrduDate = (d: Date) => {
    try {
      return d.toLocaleDateString('ur-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d.toISOString().split('T')[0];
    }
  };

  const formatTime12h = (time24?: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? 'شام/رات' : 'صبح';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} (${ampm})`;
  };

  return {
    status,
    statusLabelUrdu,
    isAcceptingSubmissions,
    startDateTime,
    endDateTime,
    daysRemaining,
    hoursRemaining,
    totalDurationDays: durationDays,
    formattedStartUrdu: `${formatUrduDate(startDateTime)} بوقت ${formatTime12h(startTimeStr)}`,
    formattedEndUrdu: `${formatUrduDate(endDateTime)} بوقت ${formatTime12h(campaign?.endTime || startTimeStr)}`,
    timeStatusTextUrdu,
  };
}

/**
 * Computes end Date (YYYY-MM-DD) and End Time (HH:mm) given start Date, Start Time, and Duration in Days
 */
export function computeCampaignEndDateTime(
  startDate: string,
  startTime: string,
  durationDays: number
): { endDate: string; endTime: string; formattedEndUrdu: string } {
  const sDate = startDate || new Date().toISOString().split('T')[0];
  const sTime = startTime || '08:00';
  const cleanTime = sTime.length === 5 ? `${sTime}:00` : sTime;
  let startObj = new Date(`${sDate}T${cleanTime}`);
  if (isNaN(startObj.getTime())) {
    startObj = new Date();
  }

  const safeDuration = durationDays > 0 ? durationDays : 12;
  const endObj = new Date(startObj.getTime() + safeDuration * 24 * 60 * 60 * 1000);

  const year = endObj.getFullYear();
  const month = String(endObj.getMonth() + 1).padStart(2, '0');
  const day = String(endObj.getDate()).padStart(2, '0');
  const endDate = `${year}-${month}-${day}`;
  const endTime = sTime;

  let formattedEndUrdu = '';
  try {
    const urduDate = endObj.toLocaleDateString('ur-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const [hStr, mStr] = sTime.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'شام/رات' : 'صبح';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    formattedEndUrdu = `${urduDate} بوقت ${h}:${m} (${ampm})`;
  } catch {
    formattedEndUrdu = `${endDate} ${endTime}`;
  }

  return { endDate, endTime, formattedEndUrdu };
}

export const DARJA_NAMES = [
  'اولیٰ',
  'ثانیہ',
  'ثالثہ',
  'رابعہ',
  'خامسہ',
  'سادسہ',
  'سابعہ',
  'دورة الحديث',
] as const;

export const SPECIAL_CATEGORIES = [
  'استاذ',
  'عوام',
] as const;

export const ALL_CATEGORY_NAMES = [
  ...DARJA_NAMES,
  ...SPECIAL_CATEGORIES,
] as const;

/**
 * Normalizes category/Darja name.
 * Preserves 'استاذ' and 'عوام' as separate participant categories,
 * while mapping student Darja variants/sections to the 8 canonical Jamia Darjas.
 */
export function normalizeDarjaName(rawName?: string): string {
  if (!rawName) return DARJA_NAMES[0];
  const trimmed = rawName.trim();

  // Special participant categories: استاذ and عوام
  if (
    trimmed === 'استاذ' ||
    trimmed === 'استاد' ||
    trimmed === 'اساتذہ' ||
    trimmed.includes('استاذ') ||
    trimmed.includes('استاد')
  ) {
    return 'استاذ';
  }

  if (
    trimmed === 'عوام' ||
    trimmed === 'عام' ||
    trimmed === 'عوام الناس' ||
    trimmed.includes('عوام') ||
    trimmed.includes('غیر طالبِ علم') ||
    trimmed.includes('غیر طالب علم')
  ) {
    return 'عوام';
  }

  // Exact match with Darjas
  if ((DARJA_NAMES as readonly string[]).includes(trimmed)) {
    return trimmed;
  }

  // Canonical mapping for variations and legacy section names
  if (trimmed.startsWith('اولیٰ') || trimmed.startsWith('اولى')) return 'اولیٰ';
  if (trimmed.startsWith('ثانیہ') || trimmed.startsWith('ثانيه')) return 'ثانیہ';
  if (trimmed.startsWith('ثالثہ') || trimmed.startsWith('ثالثه')) return 'ثالثہ';
  if (trimmed.startsWith('رابعہ') || trimmed.startsWith('رابعه')) return 'رابعہ';
  if (trimmed.startsWith('خامسہ') || trimmed.startsWith('خامسه')) return 'خامسہ';
  if (trimmed.startsWith('سادسہ') || trimmed.startsWith('سادسه')) return 'سادسہ';
  if (trimmed.startsWith('سابعہ') || trimmed.startsWith('سابعه')) return 'سابعہ';
  if (
    trimmed.includes('حديث') ||
    trimmed.includes('حدیث') ||
    trimmed.includes('دورة') ||
    trimmed.includes('دورۃ') ||
    trimmed.includes('دورہ')
  ) {
    return 'دورة الحديث';
  }

  return trimmed;
}

/**
 * Maps a Firestore CampaignDocument to the App's CampaignStats state
 */
export function mapDocToCampaignStats(
  data: Partial<CampaignDocument>,
  prevStats?: CampaignStats | null
): CampaignStats {
  const target = data.target ?? 0;
  const totalRecited = data.totalRecited ?? 0;
  const remaining =
    data.remaining !== undefined
      ? data.remaining
      : Math.max(0, target - totalRecited);
  const progressPercentage =
    data.progressPercentage !== undefined
      ? data.progressPercentage
      : target > 0
      ? Number(((totalRecited / target) * 100).toFixed(1))
      : 0;

  const scheduleInfo = calculateCampaignSchedule(data);

  return {
    campaignId: data.id,
    title: data.title,
    campaignTarget: target,
    totalRecited: totalRecited,
    remainingTarget: remaining,
    progressPercentage: Math.max(0, progressPercentage),
    totalSubmissionsCount: prevStats?.totalSubmissionsCount ?? 0,
    activeClassesCount: prevStats?.activeClassesCount ?? 8,
    daysRemaining: scheduleInfo.daysRemaining,
    hoursRemaining: scheduleInfo.hoursRemaining,
    startDate: data.startDate,
    startTime: data.startTime,
    durationDays: data.durationDays || scheduleInfo.totalDurationDays,
    endDate: data.endDate,
    endTime: data.endTime,
    scheduleStatus: scheduleInfo.status,
  };
}

/**
 * Gets the currently active campaign document in Firestore with minimal payload (limit 1).
 */
export async function getOrCreateActiveCampaign(): Promise<CampaignDocument> {
  const campaignColRef = collection(db, CAMPAIGN_COLLECTION);
  const q = query(campaignColRef, where('isActive', '==', true), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const activeDoc = snap.docs[0];
    return { id: activeDoc.id, ...(activeDoc.data() as CampaignDocument) };
  }

  // Fallback check on campaign/main for backward compatibility
  const mainRef = doc(db, CAMPAIGN_COLLECTION, INITIAL_MAIN_DOC_ID);
  const mainSnap = await getDoc(mainRef);

  if (mainSnap.exists()) {
    return { id: INITIAL_MAIN_DOC_ID, ...(mainSnap.data() as CampaignDocument) };
  }

  return {
    id: INITIAL_MAIN_DOC_ID,
    ...DEFAULT_CAMPAIGN_DOC,
  };
}

/**
 * Ensures at least one active campaign exists (used by Admin)
 */
export async function ensureCampaignDocExists(): Promise<CampaignDocument> {
  return await getOrCreateActiveCampaign();
}

/**
 * Subscribes in real time to the single active campaign document in Firestore.
 * Utilizes indexed query with limit(1) and local cache for instant ~10-300ms resolution.
 */
export function subscribeToCampaignStats(
  onData: (statsDoc: CampaignDocument) => void,
  onError?: (error: any) => void
) {
  const campaignColRef = collection(db, CAMPAIGN_COLLECTION);
  const activeQuery = query(campaignColRef, where('isActive', '==', true), limit(1));
  let isUnsubscribed = false;
  let hasReceivedData = false;
  const tStart = performance.now();

  const queryUnsub = onSnapshot(
    activeQuery,
    (snapshot) => {
      if (isUnsubscribed) return;

      if (!snapshot.empty) {
        hasReceivedData = true;
        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as CampaignDocument;
        const fromCache = snapshot.metadata.fromCache;
        console.log(
          `[Perf] Active campaign received in ${(performance.now() - tStart).toFixed(1)}ms (${
            fromCache ? 'Local Cache' : 'Server'
          }): Target = ${data.target}`
        );
        onData({ id: docSnap.id, ...data });
      } else {
        // Fallback check on campaign/main only if active query is empty
        const mainRef = doc(db, CAMPAIGN_COLLECTION, INITIAL_MAIN_DOC_ID);
        getDoc(mainRef)
          .then((mainSnap) => {
            if (isUnsubscribed) return;
            if (mainSnap.exists()) {
              hasReceivedData = true;
              onData({ id: INITIAL_MAIN_DOC_ID, ...(mainSnap.data() as CampaignDocument) });
            } else if (!hasReceivedData && onError) {
              onError(new Error('کوئی فعال مہم موجود نہیں ہے۔'));
            }
          })
          .catch((e) => {
            if (!isUnsubscribed && onError) onError(e);
          });
      }
    },
    (err) => {
      console.error('Campaign active listener error:', err);
      if (onError && !isUnsubscribed) onError(err);
    }
  );

  return () => {
    isUnsubscribed = true;
    queryUnsub();
  };
}

export interface CampaignScheduleParams {
  startDate?: string;
  startTime?: string;
  durationDays?: number;
  endDate?: string;
  endTime?: string;
}

/**
 * Updates the campaign target (and title, duration, schedule) of the active campaign document in Firestore.
 * Recalculates remaining and progressPercentage immediately.
 * Preserves all submissions, totalRecited count, and student/Darja performance.
 */
export async function updateActiveCampaignTarget(
  newTarget: number,
  newTitle?: string,
  scheduleParams?: CampaignScheduleParams
): Promise<CampaignDocument> {
  await ensureAuth();

  const activeCampaign = await getOrCreateActiveCampaign();
  const activeCampaignId = activeCampaign.id || INITIAL_MAIN_DOC_ID;
  const campaignRef = doc(db, CAMPAIGN_COLLECTION, activeCampaignId);

  const totalRecited = activeCampaign.totalRecited || 0;
  const remaining = Math.max(0, newTarget - totalRecited);
  const progressPercentage =
    newTarget > 0 ? Number(((totalRecited / newTarget) * 100).toFixed(1)) : 0;
  const nowIso = new Date().toISOString();

  const updatePayload: Partial<CampaignDocument> = {
    target: newTarget,
    remaining: remaining,
    progressPercentage: Math.max(0, progressPercentage),
    updatedAt: nowIso,
  };

  if (newTitle && newTitle.trim()) {
    updatePayload.title = newTitle.trim();
  }

  if (scheduleParams) {
    if (scheduleParams.startDate) updatePayload.startDate = scheduleParams.startDate;
    if (scheduleParams.startTime) updatePayload.startTime = scheduleParams.startTime;
    if (scheduleParams.durationDays !== undefined && scheduleParams.durationDays > 0) {
      updatePayload.durationDays = scheduleParams.durationDays;
    }
    if (scheduleParams.endDate) updatePayload.endDate = scheduleParams.endDate;
    if (scheduleParams.endTime) updatePayload.endTime = scheduleParams.endTime;
  }

  await updateDoc(campaignRef, updatePayload);

  // Also sync to campaign/main if exists
  if (activeCampaignId !== INITIAL_MAIN_DOC_ID) {
    try {
      const mainRef = doc(db, CAMPAIGN_COLLECTION, INITIAL_MAIN_DOC_ID);
      const mainSnap = await getDoc(mainRef);
      if (mainSnap.exists()) {
        await updateDoc(mainRef, updatePayload);
      }
    } catch (e) {
      console.warn('Could not sync main doc:', e);
    }
  }

  const updatedSnap = await getDoc(campaignRef);
  return {
    id: activeCampaignId,
    ...(updatedSnap.data() as CampaignDocument),
  };
}

/**
 * Creates a NEW campaign document when Admin starts a new campaign or resets the campaign.
 * Uses a Firestore batch operation to atomically deactivate previous active campaigns and activate the new one.
 * Preserves all historical campaigns and previous submissions in Firestore without deleting data.
 */
export async function createNewCampaign(
  target: number,
  title?: string,
  scheduleParamsOrStartDate?: string | CampaignScheduleParams,
  legacyEndDate?: string
): Promise<CampaignDocument> {
  await ensureAuth();

  const campaignColRef = collection(db, CAMPAIGN_COLLECTION);
  const nowIso = new Date().toISOString();

  // 1. Fetch any currently active campaigns
  const activeQuery = query(campaignColRef, where('isActive', '==', true));
  const activeSnap = await getDocs(activeQuery);

  const batch = writeBatch(db);
  const updatedDocIds = new Set<string>();

  // Deactivate all previously active campaigns atomically while preserving their history
  activeSnap.docs.forEach((docSnap) => {
    updatedDocIds.add(docSnap.id);
    batch.update(docSnap.ref, {
      isActive: false,
      archivedAt: nowIso,
      updatedAt: nowIso,
    });
  });

  // Also deactivate campaign/main if it exists and wasn't already in activeSnap
  if (!updatedDocIds.has(INITIAL_MAIN_DOC_ID)) {
    try {
      const mainRef = doc(db, CAMPAIGN_COLLECTION, INITIAL_MAIN_DOC_ID);
      const mainSnap = await getDoc(mainRef);
      if (mainSnap.exists() && mainSnap.data().isActive !== false) {
        batch.update(mainRef, {
          isActive: false,
          archivedAt: nowIso,
          updatedAt: nowIso,
        });
      }
    } catch (e) {
      console.warn('Note checking main doc during campaign reset:', e);
    }
  }

  // Determine schedule params
  let startDate = new Date().toISOString().split('T')[0];
  let startTime = '08:00';
  let durationDays = 12;
  let endDate = DEFAULT_CAMPAIGN_DOC.endDate;
  let endTime = '08:00';

  if (typeof scheduleParamsOrStartDate === 'object' && scheduleParamsOrStartDate !== null) {
    if (scheduleParamsOrStartDate.startDate) startDate = scheduleParamsOrStartDate.startDate;
    if (scheduleParamsOrStartDate.startTime) startTime = scheduleParamsOrStartDate.startTime;
    if (scheduleParamsOrStartDate.durationDays) durationDays = scheduleParamsOrStartDate.durationDays;
    if (scheduleParamsOrStartDate.endDate) endDate = scheduleParamsOrStartDate.endDate;
    if (scheduleParamsOrStartDate.endTime) endTime = scheduleParamsOrStartDate.endTime;
  } else if (typeof scheduleParamsOrStartDate === 'string') {
    startDate = scheduleParamsOrStartDate;
    if (legacyEndDate) endDate = legacyEndDate;
  }

  // Ensure computed end matches duration if not explicitly provided
  if (!legacyEndDate && (!scheduleParamsOrStartDate || typeof scheduleParamsOrStartDate !== 'object' || !scheduleParamsOrStartDate.endDate)) {
    const computed = computeCampaignEndDateTime(startDate, startTime, durationDays);
    endDate = computed.endDate;
    endTime = computed.endTime;
  }

  // 2. Create brand new active campaign document with unique ID
  const newRef = doc(campaignColRef);
  const newCampaign: CampaignDocument = {
    id: newRef.id,
    title: (title && title.trim()) || DEFAULT_CAMPAIGN_DOC.title,
    target: target > 0 ? target : DEFAULT_CAMPAIGN_DOC.target,
    totalRecited: 0,
    remaining: target > 0 ? target : DEFAULT_CAMPAIGN_DOC.target,
    progressPercentage: 0,
    startDate,
    startTime,
    durationDays,
    endDate,
    endTime,
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  batch.set(newRef, newCampaign);

  // Commit everything in one atomic batch
  await batch.commit();

  console.log(`Successfully started new active campaign [ID: ${newRef.id}] with target: ${target}`);
  return newCampaign;
}

/**
 * Fetches all campaigns (active and archived) for administrative review and historical audits.
 */
export async function getAllCampaigns(): Promise<CampaignDocument[]> {
  await ensureAuth();
  const campaignColRef = collection(db, CAMPAIGN_COLLECTION);
  const snap = await getDocs(campaignColRef);
  const list: CampaignDocument[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as CampaignDocument),
  }));
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return list;
}

/**
 * Fetches all historical submissions across all campaigns for auditing.
 */
export async function getAllHistoricalSubmissions(): Promise<SubmissionItem[]> {
  await ensureAuth();
  const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
  const snap = await getDocs(submissionsRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as SubmissionItem),
    className: normalizeDarjaName(d.data().className),
  }));
}

/**
 * Resets the active campaign safely by creating a brand new active campaign:
 * - Keeps all previous campaigns and historical submissions محفوظ in Firestore.
 * - Starts the new campaign with totalRecited = 0, remaining = target, progressPercentage = 0.
 * - Submissions and Darja rankings for the new active campaign automatically start from zero.
 */
export async function resetCampaign(
  target?: number,
  title?: string,
  scheduleParams?: CampaignScheduleParams
): Promise<CampaignDocument> {
  await ensureAuth();

  const currentActive = await getOrCreateActiveCampaign();
  const effectiveTarget = target && target > 0 ? target : currentActive.target || DEFAULT_CAMPAIGN_DOC.target;
  const effectiveTitle = title && title.trim() ? title : currentActive.title || DEFAULT_CAMPAIGN_DOC.title;

  return await createNewCampaign(effectiveTarget, effectiveTitle, scheduleParams);
}

/**
 * Atomically saves a new submission linked to the active campaign ID and updates the campaign document inside a single transaction
 */
export async function addSubmissionAndUpdateCampaign(
  submissionData: Omit<SubmissionItem, 'id'>
): Promise<{ docId: string; updatedCampaign: CampaignDocument }> {
  await ensureAuth();

  const activeCampaign = await getOrCreateActiveCampaign();
  const activeCampaignId = activeCampaign.id || INITIAL_MAIN_DOC_ID;

  const fullSubmission = {
    ...submissionData,
    campaignId: activeCampaignId,
    submittedAt: submissionData.submittedAt || new Date().toISOString(),
  };

  const campaignRef = doc(db, CAMPAIGN_COLLECTION, activeCampaignId);
  const newSubRef = doc(collection(db, SUBMISSIONS_COLLECTION));
  let updatedCampaignDoc: CampaignDocument = activeCampaign;

  await runTransaction(db, async (transaction) => {
    const campaignSnap = await transaction.get(campaignRef);
    let current: CampaignDocument = activeCampaign;

    if (campaignSnap.exists()) {
      current = campaignSnap.data() as CampaignDocument;
    }

    const duroodAdded = submissionData.count || submissionData.duroodCount || 0;
    const newTotal = (current.totalRecited || 0) + duroodAdded;
    const newTarget = current.target || 0;
    const newRemaining = Math.max(0, newTarget - newTotal);
    const newProgressPercentage =
      newTarget > 0 ? Number(((newTotal / newTarget) * 100).toFixed(1)) : 0;
    const nowIso = new Date().toISOString();

    updatedCampaignDoc = {
      ...current,
      id: activeCampaignId,
      target: newTarget,
      totalRecited: newTotal,
      remaining: newRemaining,
      progressPercentage: newProgressPercentage,
      updatedAt: nowIso,
    };

    transaction.set(newSubRef, fullSubmission);
    transaction.set(campaignRef, updatedCampaignDoc, { merge: true });
  });

  return {
    docId: newSubRef.id,
    updatedCampaign: updatedCampaignDoc,
  };
}

/**
 * Listens to submissions for a specific campaign ID and calculates class totals
 */
export function subscribeToSubmissionsAndClassTotals(
  campaignId: string,
  initialClasses: JamiaClass[],
  onData: (submissions: SubmissionItem[], updatedClasses: JamiaClass[]) => void
) {
  const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
  const q = query(submissionsRef, where('campaignId', '==', campaignId));

  return onSnapshot(
    q,
    (snapshot) => {
      const subList: SubmissionItem[] = snapshot.docs.map((d) => {
        const data = d.data() as SubmissionItem;
        const normalizedClass = normalizeDarjaName(data.className);
        return {
          id: d.id,
          ...data,
          className: normalizedClass,
        };
      });

      // Reset class totals to 0 for this campaign
      const classTotalsMap: Record<string, number> = {};
      initialClasses.forEach((cls) => {
        classTotalsMap[cls.name] = 0;
      });

      subList.forEach((sub) => {
        const added = sub.count || sub.duroodCount || 0;
        const targetClass = normalizeDarjaName(sub.className);
        if (classTotalsMap[targetClass] !== undefined) {
          classTotalsMap[targetClass] += added;
        } else {
          classTotalsMap[targetClass] = added;
        }
      });

      const updatedClasses = initialClasses.map((cls) => ({
        ...cls,
        totalDurood: classTotalsMap[cls.name] || 0,
      }));

      // Sort by totalDurood descending and assign ranks
      updatedClasses.sort((a, b) => b.totalDurood - a.totalDurood);
      updatedClasses.forEach((cls, idx) => {
        cls.rank = idx + 1;
      });

      onData(subList, updatedClasses);
    },
    (err) => {
      console.warn('Submissions listener error (retrying automatically):', err);
    }
  );
}

/**
 * Calculates student-wise performance from submissions belonging to the active campaign.
 * Automatically aggregates total Durood and submission count per student & Darja.
 * Ranks students in descending order of total Durood.
 */
export function calculateStudentPerformance(
  submissions: SubmissionItem[]
): StudentPerformance[] {
  const map: Record<
    string,
    {
      studentName: string;
      className: string;
      totalDurood: number;
      count: number;
      lastSubmittedAt?: string;
    }
  > = {};

  submissions.forEach((sub) => {
    // Only include submissions with valid student names (exclude empty, whitespace-only, null/undefined strings)
    const rawName = sub.studentName?.trim();
    if (!rawName || rawName === 'undefined' || rawName === 'null') return;

    const darja = normalizeDarjaName(sub.className);
    const key = `${rawName.toLowerCase()}_${darja}`;
    const addedCount = sub.count || sub.duroodCount || 0;

    if (!map[key]) {
      map[key] = {
        studentName: rawName,
        className: darja,
        totalDurood: 0,
        count: 0,
        lastSubmittedAt: sub.submittedAt || sub.timestamp,
      };
    }

    map[key].totalDurood += addedCount;
    map[key].count += 1;
    if (
      sub.submittedAt &&
      (!map[key].lastSubmittedAt || sub.submittedAt > (map[key].lastSubmittedAt || ''))
    ) {
      map[key].lastSubmittedAt = sub.submittedAt;
    }
  });

  const studentList: StudentPerformance[] = Object.values(map).map((item) => ({
    studentName: item.studentName,
    className: item.className,
    totalDurood: item.totalDurood,
    submissionCount: item.count,
    lastSubmittedAt: item.lastSubmittedAt,
    rank: 0,
  }));

  studentList.sort((a, b) => b.totalDurood - a.totalDurood);
  studentList.forEach((st, idx) => {
    st.rank = idx + 1;
  });

  return studentList;
}

/**
 * Removes a submission and adjusts the active campaign's total recited count accordingly.
 * Triggered by an authorized Admin.
 */
export async function deleteSubmissionAndUpdateCampaign(
  submissionId: string
): Promise<void> {
  await ensureAuth();
  const subRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
  const subSnap = await getDoc(subRef);
  if (!subSnap.exists()) return;

  const subData = subSnap.data() as SubmissionItem;
  const subCount = subData.count || subData.duroodCount || 0;
  const campaignId = subData.campaignId;

  if (campaignId) {
    const campaignRef = doc(db, CAMPAIGN_COLLECTION, campaignId);
    await runTransaction(db, async (transaction) => {
      const campSnap = await transaction.get(campaignRef);
      if (campSnap.exists()) {
        const campData = campSnap.data() as CampaignDocument;
        const currentTotal = campData.totalRecited || 0;
        const newTotal = Math.max(0, currentTotal - subCount);
        const target = campData.target || 0;
        const newRemaining = Math.max(0, target - newTotal);
        const newProgress =
          target > 0 ? Number(((newTotal / target) * 100).toFixed(1)) : 0;

        transaction.update(campaignRef, {
          totalRecited: newTotal,
          remaining: newRemaining,
          progressPercentage: Math.max(0, newProgress),
          updatedAt: new Date().toISOString(),
        });
      }
      transaction.delete(subRef);
    });
  } else {
    await deleteDoc(subRef);
  }
}


