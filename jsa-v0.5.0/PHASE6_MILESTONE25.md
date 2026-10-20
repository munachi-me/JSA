# JSA v0.4.1 — Date & Time Analytics and Direct Column Positioning

## Scope
- Parse common date/datetime formats and recognize time-only values.
- Extract year, quarter, month number/name, ISO week number, day, weekday name/number, calendar date, hour, minute, and time.
- Keep month and weekday category ordering conventional in row sorting and chart categories.
- Allow a column to be moved directly to a user-entered one-based position in one reversible pipeline step.

## Compatibility
- Existing one-position Left/Right column controls remain available.
- Existing ISO date/datetime parsing and historical `extractDate` steps remain supported.
- Precision controls and custom split column names are retained from v0.4.0.
- Ambiguous slash dates are interpreted day-first; unambiguous month-first dates are supported.

## Validation
- Added tests for flexible date/time parsing, extraction, month sort metadata, and direct column repositioning.
- Run `npm install`, `npm test`, and `npm run build` in Acode before accepting the release.
