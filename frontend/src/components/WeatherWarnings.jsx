import { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

import { useWeather } from '../hooks/useWeather';

function getWarningLevelStyles(level) {
  const normalized = (level || 'Yellow').toLowerCase();

  if (normalized.includes('red')) {
    return {
      bg: 'bg-red-950/50',
      border: 'border-red-500/50',
      badge: 'bg-red-600 text-white',
      text: 'text-red-100',
      subText: 'text-red-300/80',
      icon: ShieldAlert,
      iconClass: 'text-red-400',
      accent: 'bg-red-500',
    };
  }

  if (normalized.includes('orange')) {
    return {
      bg: 'bg-orange-950/40',
      border: 'border-orange-500/50',
      badge: 'bg-orange-500 text-slate-950',
      text: 'text-orange-100',
      subText: 'text-orange-300/80',
      icon: AlertTriangle,
      iconClass: 'text-orange-400',
      accent: 'bg-orange-400',
    };
  }

  return {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/40',
    badge: 'bg-amber-400 text-slate-950',
    text: 'text-amber-100',
    subText: 'text-amber-300/80',
    icon: AlertCircle,
    iconClass: 'text-amber-400',
    accent: 'bg-amber-400',
  };
}

function getWarningPriority(level) {
  const normalized = (level || '').toLowerCase();

  if (normalized.includes('red')) return 3;
  if (normalized.includes('orange')) return 2;
  return 1;
}

function formatDateTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString([], {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getHighestWarning(warnings) {
  if (!warnings?.length) return null;

  return [...warnings].sort(
    (a, b) =>
      getWarningPriority(b.level) -
      getWarningPriority(a.level)
  )[0];
}

function WarningDetails({ warning }) {
  const styles = getWarningLevelStyles(
    warning.level
  );

  const Icon = styles.icon;

  const onset = formatDateTime(warning.onset);
  const expiry = formatDateTime(warning.expiry);
  const updated = formatDateTime(warning.updated);

  return (
    <article
      className={`
        relative overflow-hidden
        rounded-2xl border
        ${styles.border}
        ${styles.bg}
      `}
    >
      {/* Accent */}
      <div
        className={`
          absolute left-0 top-0 h-full w-1
          ${styles.accent}
        `}
      />

      <div className="p-4 pl-5 md:p-5 md:pl-6">

        {/* Warning heading */}
        <div className="flex items-start gap-3">

          <Icon
            className={`mt-0.5 h-6 w-6 shrink-0 ${styles.iconClass}`}
          />

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`
                  rounded-md px-2.5 py-1
                  text-[10px] font-bold
                  uppercase tracking-wider
                  ${styles.badge}
                `}
              >
                {warning.level || 'Yellow'}
              </span>

              {warning.severity && (
                <span className="rounded-full border border-slate-700/60 bg-slate-900/40 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                  Severity: {warning.severity}
                </span>
              )}

              {warning.certainty && (
                <span className="rounded-full border border-slate-700/60 bg-slate-900/40 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                  Certainty: {warning.certainty}
                </span>
              )}
            </div>

            <h3
              className={`
                mt-3 text-base font-bold leading-snug
                md:text-lg
                ${styles.text}
              `}
            >
              {warning.headline ||
                `${warning.type || 'Weather'} Warning`}
            </h3>

            {warning.description && (
              <p
                className={`
                  mt-2 text-xs leading-relaxed
                  md:text-sm
                  ${styles.subText}
                `}
              >
                {warning.description}
              </p>
            )}
          </div>
        </div>

        {/* Timing */}
        {(onset || expiry || updated) && (
          <div className="mt-4 border-t border-slate-800/40 pt-3">

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">

              {onset && (
                <span>
                  <strong className="text-slate-300">
                    From:
                  </strong>{' '}
                  {onset}
                </span>
              )}

              {expiry && (
                <span>
                  <strong className="text-slate-300">
                    Until:
                  </strong>{' '}
                  {expiry}
                </span>
              )}

              {updated && (
                <span>
                  <strong className="text-slate-300">
                    Updated:
                  </strong>{' '}
                  {updated}
                </span>
              )}

            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function WeatherWarnings() {
  const { warnings } = useWeather();

  const [isOpen, setIsOpen] = useState(false);

  const sortedWarnings = useMemo(() => {
    if (!warnings?.length) {
      return [];
    }

    return [...warnings].sort(
      (a, b) =>
        getWarningPriority(b.level) -
        getWarningPriority(a.level)
    );
  }, [warnings]);

  if (sortedWarnings.length === 0) {
    return null;
  }

  const highestWarning =
    getHighestWarning(sortedWarnings);

  const highestStyles =
    getWarningLevelStyles(
      highestWarning?.level
    );

  const HighestIcon = highestStyles.icon;

  const warningCount =
    sortedWarnings.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/40 shadow-xl">

      {/* =====================================================
          COLLAPSED HEADER
      ====================================================== */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className={`
          group flex w-full items-center gap-3
          p-4 text-left
          transition-colors
          hover:bg-slate-800/40
          ${highestStyles.bg}
        `}
      >

        {/* Warning icon */}
        <div
          className={`
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            border ${highestStyles.border}
            bg-slate-950/30
          `}
        >
          <HighestIcon
            className={`h-5 w-5 ${highestStyles.iconClass}`}
          />
        </div>

        {/* Summary */}
        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-200">
              Active Weather Warnings
            </span>

            <span
              className={`
                rounded-full px-2 py-0.5
                text-[10px] font-bold
                uppercase tracking-wide
                ${highestStyles.badge}
              `}
            >
              {highestWarning?.level || 'Yellow'}
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-slate-500">
            {highestWarning?.headline ||
              `${warningCount} active ${
                warningCount === 1
                  ? 'warning'
                  : 'warnings'
              }`}
          </p>
        </div>

        {/* Count */}
        <span className="hidden shrink-0 text-xs font-medium text-slate-500 sm:block">
          {warningCount}{' '}
          {warningCount === 1
            ? 'warning'
            : 'warnings'}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`
            h-5 w-5 shrink-0
            text-slate-500
            transition-transform duration-300
            group-hover:text-slate-300
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* =====================================================
          EXPANDED WARNINGS
      ====================================================== */}
      {isOpen && (
        <div className="border-t border-slate-800/60 p-3 md:p-4">
          <div className="space-y-3">
            {sortedWarnings.map(
              (warning, idx) => (
                <WarningDetails
                  key={
                    warning.id || idx
                  }
                  warning={warning}
                />
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}