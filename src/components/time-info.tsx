"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/profile/services";

export default function TimeInfo() {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!profile) {
    return today;
  }

  return `${today} • Sprint ${profile.timeConfig.currentSprint} • Quarter ${profile.timeConfig.currentQuarter}`;
}
