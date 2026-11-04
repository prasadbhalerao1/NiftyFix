/**
 * www.niftyfix.in → https://niftyfix.in, keeping the path and query.
 * One canonical host means search engines see one site, not two copies.
 * 301 because the move is permanent; browsers and Google cache it.
 */
export const CANONICAL_ORIGIN = 'https://niftyfix.in';

export function canonicalUrl(requestUrl: string): string {
  const { pathname, search } = new URL(requestUrl);
  return `${CANONICAL_ORIGIN}${pathname}${search}`;
}

export default {
  fetch(request: Request): Response {
    return Response.redirect(canonicalUrl(request.url), 301);
  },
};
