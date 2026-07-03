/** URL canonique production — fallback unique pour toutes les Edge Functions. */
export const CANONICAL_APP_URL = 'https://www.pedagogia-drive.fr'

export function appBaseUrl(): string {
  return (Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || CANONICAL_APP_URL).replace(/\/$/, '')
}

export function acceptInviteUrl(): string {
  return `${appBaseUrl()}/accept-invite`
}

export function loginUrl(): string {
  return `${appBaseUrl()}/login`
}
