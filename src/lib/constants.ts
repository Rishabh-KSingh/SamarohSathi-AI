import {
  OccasionType,
  SpendingPriorityItem,
  AtmosphereOption,
  GuestAudienceType,
  StepMeta,
} from "@/types/event";

export const OCCASION_OPTIONS: OccasionType[] = [
  "Wedding",
  "Reception",
  "Birthday Party",
  "Anniversary",
  "Engagement",
  "Sangeet & Mehendi",
  "Housewarming (Griha Pravesh)",
  "Baby Shower (Godh Bharai)",
  "Corporate Gathering",
  "Festival Celebration",
  "Retirement Party",
  "Intimate Dinner",
  "Other",
];

export const ATMOSPHERE_OPTIONS: AtmosphereOption[] = [
  {
    id: "simple_elegant",
    label: "Simple & Elegant",
    tagline: "Understated grace with high quality details",
    description: "Focus on clean aesthetic, calm atmosphere, and meaningful connections without sensory clutter.",
  },
  {
    id: "premium_celebration",
    label: "Premium Celebration",
    tagline: "Opulent hospitality & unforgettable grandeur",
    description: "Curated experiences, elevated catering, high-touch guest service, and dramatic presentation.",
  },
  {
    id: "traditional_heritage",
    label: "Traditional & Cultural",
    tagline: "Authentic rituals & timeless customs",
    description: "Rooted in authentic cultural rituals, classic regional decor, and ceremonial dining.",
  },
  {
    id: "modern_chic",
    label: "Modern & Contemporary",
    tagline: "Minimalist lines with fresh, vibrant energy",
    description: "Contemporary styling, acoustic/lounge atmosphere, photogenic moments, and sleek hospitality.",
  },
  {
    id: "family_friendly",
    label: "Family & Multi-Generational",
    tagline: "Inclusive comfort for toddlers to grandparents",
    description: "Thoughtful pacing, accessible seating, child-friendly activities, and generous hospitality.",
  },
  {
    id: "intimate_gathering",
    label: "Intimate & Cozy",
    tagline: "Close circle of cherished loved ones",
    description: "Deep conversations, customized favors, shared storytelling, and warm ambient lighting.",
  },
];

export const SPENDING_PRIORITIES: SpendingPriorityItem[] = [
  {
    id: "food",
    label: "Food & Guest Dining Experience",
    description: "Live counters, authentic regional menus, and exceptional hospitality.",
  },
  {
    id: "venue",
    label: "Venue & Atmosphere",
    description: "Scenic location, comfortable climate control, and memorable spaces.",
  },
  {
    id: "decor",
    label: "Decor & Floral Aesthetics",
    description: "Themed mandaps, floral styling, lighting architecture, and photo backdrops.",
  },
  {
    id: "photography",
    label: "Photography & Cinematography",
    description: "Candid emotional captures, traditional family portraits, and highlight reels.",
  },
  {
    id: "entertainment",
    label: "Entertainment & Music",
    description: "Live folk/classical artists, DJ, emcee, or engaging interactive games.",
  },
  {
    id: "simplicity",
    label: "Overall Simplicity & Peace of Mind",
    description: "Low-stress execution, minimal vendor juggling, and predictable timings.",
  },
  {
    id: "hospitality",
    label: "Guest Hospitality & Transport",
    description: "Shuttles, welcoming gifts, room hampers, and dedicated guest coordinators.",
  },
];

export const GUEST_AUDIENCE_OPTIONS: { id: GuestAudienceType; label: string }[] = [
  { id: "family_relatives", label: "Family & Relatives" },
  { id: "close_friends", label: "Close Friends & Peers" },
  { id: "mixed_generations", label: "Mixed Generations (Kids to Seniors)" },
  { id: "colleagues", label: "Professional Colleagues" },
  { id: "vip_dignitaries", label: "VIP Guests / Dignitaries" },
  { id: "kids_centric", label: "Kids & Young Families" },
];

export const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  { code: "AED", symbol: "AED", name: "UAE Dirham (AED)" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar (CAD)" },
];

export const WIZARD_STEPS: StepMeta[] = [
  {
    step: 1,
    title: "Event Details",
    shortTitle: "Basics",
    description: "Give your celebration a name, date, venue, and estimated guest list.",
  },
  {
    step: 2,
    title: "Budget & Flexibility",
    shortTitle: "Budget",
    description: "Set your financial boundaries and define how strict your allocation is.",
  },
  {
    step: 3,
    title: "Spending Priorities",
    shortTitle: "Priorities",
    description: "Rank what matters most to allocate your budget effectively.",
  },
  {
    step: 4,
    title: "Review & Create Event",
    shortTitle: "Review",
    description: "Verify all your celebration parameters before saving your plan.",
  },
];

export const STANDARD_BUDGET_CATEGORIES = [
  "Venue",
  "Catering and Food",
  "Decoration",
  "Photography and Videography",
  "Entertainment",
  "Invitations",
  "Transportation",
  "Accommodation",
  "Miscellaneous",
  "Emergency Reserve",
] as const;

export const TASK_STATUS_CONFIG = {
  "Not Started": {
    label: "Not Started",
    badgeVariant: "default" as const,
    color: "#6B635B",
    bg: "#F5F2EB",
  },
  "In Progress": {
    label: "In Progress",
    badgeVariant: "primary" as const,
    color: "#C8963E",
    bg: "#FFF9F0",
  },
  "Completed": {
    label: "Completed",
    badgeVariant: "accent" as const,
    color: "#3F7A56",
    bg: "#F0F7F3",
  },
  "Delayed": {
    label: "Delayed",
    badgeVariant: "secondary" as const,
    color: "#C05621",
    bg: "#FFF5F0",
  },
};

export const TASK_PRIORITY_CONFIG = {
  High: {
    label: "High Priority",
    color: "#5B1D2E",
    bg: "#FDF2F4",
    border: "#F3D2D9",
  },
  Medium: {
    label: "Medium Priority",
    color: "#C8963E",
    bg: "#FFF9F0",
    border: "#F6E5C8",
  },
  Low: {
    label: "Low Priority",
    color: "#6B635B",
    bg: "#F5F2EB",
    border: "#EBE5DC",
  },
};
