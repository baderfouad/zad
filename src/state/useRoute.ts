import { useEffect, useState } from 'react';

export type Route = 'about' | 'owner' | 'kitchen' | 'data';
const ROUTES: Route[] = ['about', 'owner', 'kitchen', 'data'];

const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'about';
};
/** Plain #name links (#owner, #kitchen…). #/owner still works for old links. */
export const href = (r: Route) => `#${r}`;

export function useRoute(): Route {
  const [r, setR] = useState<Route>(parse);
  useEffect(() => {
    const on = () => setR(parse());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return r;
}
