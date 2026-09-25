export type NavItem = { href: string; label: string };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Executive Dashboard" },
      { href: "/data-explorer", label: "Data Explorer" },
      { href: "/case-study", label: "Case Study" },
    ],
  },
  {
    title: "Description & Association",
    items: [
      { href: "/descriptive", label: "Descriptive Statistics" },
      { href: "/association", label: "Association" },
      { href: "/misleading-charts", label: "How Charts Can Mislead" },
    ],
  },
  {
    title: "Probability",
    items: [
      { href: "/probability", label: "Probability Engine" },
      { href: "/bayes", label: "Bayes' Theorem" },
      { href: "/independence", label: "Independence Check" },
      { href: "/combinatorics", label: "Campaign Combinatorics" },
    ],
  },
  {
    title: "Random Variables & Uncertainty",
    items: [
      { href: "/random-variables", label: "Random Variables" },
      { href: "/binomial", label: "Conversion Forecast (Binomial)" },
      { href: "/hypergeometric", label: "Campaign Sampling (Hypergeometric)" },
      { href: "/distributions", label: "Continuous Distribution Lab" },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/segmentation", label: "Customer Segmentation" },
      { href: "/customer-value", label: "Customer Value" },
      { href: "/decision-lab", label: "Decision Lab" },
      { href: "/calculator", label: "Statistics Calculator" },
      { href: "/limitations", label: "Limitations" },
    ],
  },
];
