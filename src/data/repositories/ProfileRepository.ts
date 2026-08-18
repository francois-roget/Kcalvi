import type { Observable } from '@nozbe/watermelondb/utils/rx';

import type { DomainError, Result, UserProfile } from '@/domain/types';

export type CreateProfileInput = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;

export interface ProfileRepository {
  /** Observed query: emits the current profile (or null while onboarding is incomplete). */
  observe(): Observable<UserProfile | null>;
  create(input: CreateProfileInput): Promise<Result<UserProfile, DomainError>>;
  /** Deletes the current profile to allow restarting onboarding from scratch. */
  reset(): Promise<Result<void, DomainError>>;
}
