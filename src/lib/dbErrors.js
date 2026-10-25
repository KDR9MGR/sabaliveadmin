/* The error text of "that database function is not on this project yet" (PostgREST 404 / Postgres 42883). A new panel page calls the new function first
   and falls back to the old one on this, so the panel keeps working on a project whose migration has not been applied. A missing COLUMN or TABLE does
   not match: only functions. */
export const MISSING_FUNCTION = /could not find the function|PGRST202|42883|function [^\n]* does not exist/i

export const isMissingFunction = (error) => !!error && (error.code === 'PGRST202' || error.code === '42883' || MISSING_FUNCTION.test(error.message || ''))
