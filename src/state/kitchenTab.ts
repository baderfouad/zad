export type KitchenTab = 'plan' | 'insights' | 'forecast';
export const KITCHEN_TABS: KitchenTab[] = ['plan', 'insights', 'forecast'];
const KEY = 'zad-kitchen-tab';

/** The Kitchen tab to open; remembered for the session so links from other pages can choose it. */
export function getKitchenTab(): KitchenTab {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v && (KITCHEN_TABS as string[]).includes(v)) return v as KitchenTab;
  } catch { /* storage blocked */ }
  return 'plan';
}
export function setKitchenTab(tab: KitchenTab) {
  try { sessionStorage.setItem(KEY, tab); } catch { /* storage blocked */ }
}
