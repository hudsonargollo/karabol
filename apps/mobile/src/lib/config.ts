// TODO: move to app.config.js `extra` + expo-constants once we have real
// per-environment (dev/staging/prod) API hosts to switch between.
export const API_URL = 'https://karaoke.clubemkt.digital';

// "Web application" OAuth client from https://console.cloud.google.com/apis/credentials,
// matching apps/api's GOOGLE_CLIENT_ID (same client, both sides check the same audience).
// AuthScreen logs the redirect URI to add to that client's Authorized redirect URIs
// on first run — Google rejects the sign-in request until it's whitelisted there.
export const GOOGLE_CLIENT_ID = '867375962703-qd3ms77tvi8ap89j690esho9bvdulj5v.apps.googleusercontent.com';
