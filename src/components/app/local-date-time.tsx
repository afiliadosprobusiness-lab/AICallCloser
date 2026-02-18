"use client";

import { useMemo, useSyncExternalStore } from "react";

type LocalDateTimeProps = {
  value: string;
  className?: string;
};

export function LocalDateTime(props: LocalDateTimeProps) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const parsedDate = useMemo(() => new Date(props.value), [props.value]);

  const formatted = useMemo(() => {
    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(parsedDate);
  }, [parsedDate]);

  const detailed = useMemo(() => {
    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "long",
    }).format(parsedDate);
  }, [parsedDate]);

  return (
    <time className={props.className} dateTime={props.value} title={isClient ? detailed : undefined} suppressHydrationWarning>
      {isClient ? formatted : ""}
    </time>
  );
}
