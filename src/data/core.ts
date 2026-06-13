// Client data layer for the core loop (P2a). Thin hooks over Convex so the
// screens stay close to their mock shape. Circles + Rewards remain on the mock
// store until P2b.

import { useMutation, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { HABIT_LIBRARY } from '@/data/habitLibrary';
import { todayISO, todayWeekday, yesterdayISO } from '@/lib/date';
import type { AwardResult } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

function tz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Single reactive read for Today / Profile / Progress. `undefined` while loading. */
export function useSnapshot() {
  return useQuery(api.core.snapshot, { weekday: todayWeekday(), localDate: todayISO() });
}

export function useLedger() {
  return useQuery(api.core.ledger, {});
}

export type Snapshot = NonNullable<ReturnType<typeof useSnapshot>>;
export type SnapshotHabit = Snapshot['habits'][number];

/** Core mutations, wrapped to match the mock store's call shapes. */
export function useCoreActions() {
  const completeM = useMutation(api.completions.completeHabit);
  const addLibraryM = useMutation(api.habits.addFromLibrary);
  const addCustomM = useMutation(api.habits.addCustom);
  const setProfileM = useMutation(api.profile.setProfile);
  const completeOnboardingM = useMutation(api.profile.completeOnboarding);
  const genUploadUrlM = useMutation(api.storage.generateUploadUrl);
  const setAward = useAppStore((s) => s.setAward);

  async function uploadProof(uri: string): Promise<string> {
    const uploadUrl = await genUploadUrlM({});
    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body: blob,
    });
    const { storageId } = (await res.json()) as { storageId: string };
    return storageId;
  }

  return {
    /** Complete a habit (optionally with a proof photo). Sets `lastAward` for /award. */
    async completeHabit(
      habitId: Id<'habits'>,
      opts?: { proofUri?: string; caption?: string },
    ): Promise<AwardResult> {
      let proof: { photoStorageId: string; caption?: string; visibility: 'circle' } | undefined;
      if (opts?.proofUri) {
        const photoStorageId = await uploadProof(opts.proofUri);
        // 'circle' so proofs surface in the user's circle feed (no-op if solo).
        proof = { photoStorageId, caption: opts.caption, visibility: 'circle' };
      }
      const award = (await completeM({
        habitId,
        localDate: todayISO(),
        yesterdayISO: yesterdayISO(),
        timezone: tz(),
        source: 'manual',
        proof,
      })) as AwardResult;
      setAward(award);
      return award;
    },

    /** Seed chosen library habits (onboarding). */
    async pickHabits(libraryIds: string[]) {
      const habits = HABIT_LIBRARY.filter((h) => libraryIds.includes(h.id)).map((h) => ({
        name: h.name,
        icon: h.icon,
        category: h.category,
        cadence: h.cadence,
        proofRequired: h.proofRequired,
        pointValue: h.pointValue,
        sourceId: h.id,
      }));
      await addLibraryM({ habits });
    },

    async addCustomHabit(input: { name: string; icon: string; proofRequired: boolean }) {
      await addCustomM({
        name: input.name,
        icon: input.icon,
        category: 'Custom',
        cadence: { kind: 'daily' },
        proofRequired: input.proofRequired,
        pointValue: 10,
        timezone: tz(),
      });
    },

    setProfile: (p: { name?: string; avatarColor?: string; notifyTime?: string }) =>
      setProfileM(p),
    completeOnboarding: () => completeOnboardingM({}),
  };
}
