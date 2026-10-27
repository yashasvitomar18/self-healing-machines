// Centralized API configuration.
//
// The backend base URL is configurable so the same frontend can run against
// a local FastAPI server, a deployed instance, or pure mock data for UI work.
//
// Resolution order:
//   1. Vite env var VITE_API_BASE_URL  (set in .env or .env.local)
//   2. Default to mock mode when no URL is configured.
//
// Set VITE_USE_MOCK=false (or omit a truthy base url) to force live mode.

const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const ENV_USE_MOCK = import.meta.env.VITE_USE_MOCK as string | undefined;

/** Base URL of the FastAPI backend, without a trailing slash. */
export const API_BASE_URL: string | null = ENV_BASE_URL
  ? ENV_BASE_URL.replace(/\/+$/, "")
  : null;

/**
 * Whether the app should serve labeled mock data instead of hitting the API.
 * Mock mode is the default until a real backend URL is provided, so the UI is
 * fully explorable during development without fabricating "real" results.
 */
export const USE_MOCK: boolean =
  ENV_USE_MOCK === undefined
    ? API_BASE_URL === null
    : ENV_USE_MOCK !== "false" && ENV_USE_MOCK !== "0";

/** Human-readable label for the active data source (shown in the header). */
export const DATA_SOURCE_LABEL: string = USE_MOCK
  ? "Mock data (UI preview)"
  : `Live API · ${API_BASE_URL ?? "(unconfigured)"}`;
