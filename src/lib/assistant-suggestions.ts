import * as React from "react";
import { TrendingDown, Users, Store, Calendar, LucideIcon } from "lucide-react";
import { EventData } from "@/types/event";

export interface SuggestedQuestionGroup {
  category: "Budget & Savings" | "Guest & Event Changes" | "Vendors & Quotations" | "Timeline & Priorities";
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  questions: string[];
}

export function getSuggestedQuestionGroups(event: EventData | null): SuggestedQuestionGroup[] {
  const g = event?.guestCount || 250;
  const b = event?.totalBudget || 1500000;
  const occasion =
    event?.occasion === "Wedding"
      ? "wedding"
      : event?.occasion
      ? event.occasion.toLowerCase()
      : "celebration";

  // Dynamic values tailored to the selected event
  const targetGuests = g === 250 ? 300 : Math.round((g * 1.2) / 10) * 10;
  const targetReducedBudget =
    b === 1500000 ? 1200000 : Math.round((b * 0.8) / 100000) * 100000;

  const currentBudgetStr =
    b === 1500000 ? "₹15 lakh" : `₹${b.toLocaleString("en-IN")}`;
  const reducedBudgetStr =
    targetReducedBudget === 1200000
      ? "₹12 lakh"
      : `₹${targetReducedBudget.toLocaleString("en-IN")}`;

  const photoIncAmount =
    b === 1500000
      ? "₹30,000"
      : `₹${(Math.round((b * 0.02) / 5000) * 5000 || 30000).toLocaleString("en-IN")}`;

  const menuBudgetAmount =
    b === 1500000 && targetGuests === 300
      ? "₹2,40,000"
      : `₹${(Math.round((targetGuests * 800) / 10000) * 10000).toLocaleString("en-IN")}`;

  const venueIncAmount =
    b === 1500000
      ? "₹50,000"
      : `₹${(Math.round((b * 0.033) / 10000) * 10000 || 50000).toLocaleString("en-IN")}`;

  return [
    {
      category: "Budget & Savings",
      icon: TrendingDown,
      questions: [
        `Reduce the budget from ${currentBudgetStr} to ${reducedBudgetStr} while protecting food quality and photography.`,
        `Increase photography spending by ${photoIncAmount} and suggest where to save.`,
      ],
    },
    {
      category: "Guest & Event Changes",
      icon: Users,
      questions: [
        `Increase guest count from ${g} to ${targetGuests} without increasing the total budget.`,
        `Move the ${occasion} date 10 days earlier and identify affected tasks and deadlines.`,
      ],
    },
    {
      category: "Vendors & Quotations",
      icon: Store,
      questions: [
        "Compare two caterers and identify hidden charges and missing services.",
        `Create a vegetarian menu for ${targetGuests} guests within ${menuBudgetAmount}.`,
        `Analyze a ${venueIncAmount} venue quotation increase.`,
      ],
    },
    {
      category: "Timeline & Priorities",
      icon: Calendar,
      questions: [
        "Identify the most urgent vendor bookings and tasks.",
      ],
    },
  ];
}

