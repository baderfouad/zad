import { useMemo } from 'react';
import { computeVenue } from '../forecast';
import { useApp } from './AppState';

/** Everything the pages need for the selected venue and the current scenario. */
export function useVenueView() {
  const { data, venueId, scenario } = useApp();
  return useMemo(() => (data ? computeVenue(data, venueId, scenario) : null), [data, venueId, scenario]);
}
