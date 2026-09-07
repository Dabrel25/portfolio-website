const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SECTION_ICONS: Record<string, React.ReactNode> = {
  experience: (
    <svg {...ICON_PROPS}>
      <rect x="2" y="5" width="12" height="8" rx="1" />
      <path d="M6 5V3.5C6 3 6.4 2.5 7 2.5H9C9.6 2.5 10 3 10 3.5V5" />
    </svg>
  ),
  projects: (
    <svg {...ICON_PROPS}>
      <path d="M2 4.5C2 4 2.4 3.5 3 3.5H6L7.5 5H13C13.6 5 14 5.4 14 6V11.5C14 12 13.6 12.5 13 12.5H3C2.4 12.5 2 12 2 11.5V4.5Z" />
    </svg>
  ),
  education: (
    <svg {...ICON_PROPS}>
      <path d="M1.5 6L8 3L14.5 6L8 9L1.5 6Z" />
      <path d="M4.5 7.5V10.5C4.5 11.5 6 12.5 8 12.5C10 12.5 11.5 11.5 11.5 10.5V7.5" />
    </svg>
  ),
  skills: (
    <svg {...ICON_PROPS}>
      <path d="M8 1.5L9.3 5.8L13.5 5.8L10.1 8.3L11.4 12.5L8 10L4.6 12.5L5.9 8.3L2.5 5.8L6.7 5.8L8 1.5Z" />
    </svg>
  ),
  hobbies: (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2C6.3 4 5.5 6 5.5 8C5.5 10 6.3 12 8 14" />
      <path d="M8 2C9.7 4 10.5 6 10.5 8C10.5 10 9.7 12 8 14" />
      <path d="M2 8H14" />
    </svg>
  ),
  community: (
    <svg {...ICON_PROPS}>
      <circle cx="5.5" cy="6" r="2" />
      <circle cx="10.5" cy="6" r="2" />
      <path d="M1.5 13C1.5 10.8 3.3 9.5 5.5 9.5C6.4 9.5 7.2 9.7 7.8 10.1" />
      <path d="M8.2 10.1C8.8 9.7 9.6 9.5 10.5 9.5C12.7 9.5 14.5 10.8 14.5 13" />
    </svg>
  ),
  awards: (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="6" r="4" />
      <path d="M5.5 9.5L4.5 14L8 12L11.5 14L10.5 9.5" />
    </svg>
  ),
  contact: (
    <svg {...ICON_PROPS}>
      <rect x="2" y="3.5" width="12" height="9" rx="1" />
      <path d="M2.5 4.5L8 8.5L13.5 4.5" />
    </svg>
  ),
};
