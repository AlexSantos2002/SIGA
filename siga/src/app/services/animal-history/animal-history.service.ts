import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import {
  AnimalHistoryEvent,
  AnimalHistoryEventState,
  AnimalHistoryEventType,
} from '../../models/animal/animal-history-event.model';
import { Animal } from '../../models/animal/animal.model';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AnimalHistoryService {
  constructor(private authService: AuthService) {}

  async getAnimalHistory(animal: Animal): Promise<AnimalHistoryEvent[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animal_history_events')
        .select(
          `
          id,
          created_at,
          event_type,
          state,
          title,
          badge,
          event_date,
          details
        `,
        )
        .eq('animal_id', animal.id)
        .eq('organization_id', organizationId)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ANIMAL_HISTORY);
    }

    return (data ?? []).map((event: any) => this.mapHistoryEvent(event));
  }

  private mapHistoryEvent(event: any): AnimalHistoryEvent {
    return {
      id: event.id,
      type: event.event_type as AnimalHistoryEventType,
      state: event.state as AnimalHistoryEventState,
      title: event.title,
      badge: event.badge,
      eventDate: event.event_date,
      createdAt: event.created_at,
      details: Array.isArray(event.details)
        ? event.details.filter((detail: unknown): detail is string => typeof detail === 'string')
        : [],
    };
  }
}
