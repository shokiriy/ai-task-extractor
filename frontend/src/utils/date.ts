const NOT_SPECIFIED = 'Not specified';

const deadlineFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string | null, formatter: Intl.DateTimeFormat): string {
  if (!value) {
    return NOT_SPECIFIED;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return NOT_SPECIFIED;
  }

  return formatter.format(date);
}

export function formatDeadline(value: string | null): string {
  return formatDate(value, deadlineFormatter);
}

export function formatTimestamp(value: string | null): string {
  return formatDate(value, timestampFormatter);
}

export function displayValue(value: string | null): string {
  return value?.trim() || NOT_SPECIFIED;
}
