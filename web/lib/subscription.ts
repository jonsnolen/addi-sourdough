import { SubscriptionFrequency } from "@/app/generated/prisma/enums";

export function advanceDeliveryDate(
  date: Date,
  frequency: SubscriptionFrequency
): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    default:
      d.setDate(d.getDate() + 7);
  }

  return d;
}
