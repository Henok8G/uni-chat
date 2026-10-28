import type { FC } from "react";

interface FrameComponentProps {
  className?: string;
  university: string;
  major: string;
  year: string;
}

// Maps keywords in a department name to the best matching Apple emoji asset
function getMajorEmoji(major: string): { src: string; alt: string } {
  const m = major.toLowerCase();

  if (m.includes("math") || m.includes("statistic") || m.includes("physics")) {
    return { src: "/assets/emojis/man-student.png", alt: "🧑‍🏫" };
  }
  if (
    m.includes("computer") || m.includes("software") ||
    m.includes("information technology") || m.includes("cyber") ||
    m.includes("computing")
  ) {
    return { src: "/assets/emojis/technologist.png", alt: "🧑🏽‍💻" };
  }
  if (
    m.includes("engineering") || m.includes("architecture") ||
    m.includes("construction") || m.includes("urban")
  ) {
    return { src: "/assets/emojis/graduation-cap.png", alt: "🎓" };
  }
  if (
    m.includes("art") || m.includes("theater") || m.includes("film") ||
    m.includes("music") || m.includes("painting")
  ) {
    return { src: "/assets/emojis/artist-palette.png", alt: "🎨" };
  }
  if (
    m.includes("medicine") || m.includes("pharmacy") || m.includes("nursing") ||
    m.includes("dental") || m.includes("medical") || m.includes("midwife") ||
    m.includes("anesthesia") || m.includes("radiolog")
  ) {
    return { src: "/assets/emojis/woman-student.png", alt: "👩‍⚕️" };
  }
  if (
    m.includes("journalism") || m.includes("communication") ||
    m.includes("public relations") || m.includes("broadcast")
  ) {
    return { src: "/assets/emojis/megaphone.png", alt: "📣" };
  }
  if (
    m.includes("political") || m.includes("international") ||
    m.includes("geography") || m.includes("development")
  ) {
    return { src: "/assets/emojis/globe.png", alt: "🌍" };
  }
  if (
    m.includes("language") || m.includes("literature") ||
    m.includes("english") || m.includes("amharic") || m.includes("arabic") ||
    m.includes("chinese") || m.includes("oromo") || m.includes("history")
  ) {
    return { src: "/assets/emojis/graduation-cap.png", alt: "🎓" };
  }
  if (
    m.includes("business") || m.includes("accounting") || m.includes("management") ||
    m.includes("economics") || m.includes("marketing") || m.includes("logistics") ||
    m.includes("supply chain") || m.includes("public admin")
  ) {
    return { src: "/assets/emojis/id-card.png", alt: "💼" };
  }
  if (
    m.includes("social") || m.includes("psychology") || m.includes("sociology") ||
    m.includes("education") || m.includes("civics") || m.includes("sport") ||
    m.includes("physical education") || m.includes("exercise")
  ) {
    return { src: "/assets/emojis/man-student.png", alt: "🧑‍🎓" };
  }

  // default fallback
  return { src: "/assets/emojis/technologist.png", alt: "🧑🏽‍💻" };
}

const FrameComponent: FC<FrameComponentProps> = ({ className = "", university, major, year }) => {
  const DetailCard = ({
    label,
    value,
    emoji,
    position,
  }: {
    label: string;
    value: string;
    emoji: React.ReactNode;
    position: "left" | "center" | "right";
  }) => {
    // 4-layer wave SVG encoded in Base64 (viewBox: 1440x500, dynamic peaks)
    const waveBgStyle = {
      backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTQ0MCA1MDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZmlsbD0iIzdENzlEMCIgb3BhY2l0eT0iMC44IiBkPSJNMCw1MDAgTDAsMjYwIEMgMTIwLDI0MCAyNDAsNjAgNDMwLDYwIEMgNjMwLDYwIDgwMCwzODAgMTAzMCwzODAgQyAxMjAwLDM4MCAxMzIwLDE4MCAxNDQwLDI0MCBMMTQ0MCw1MDAgWiIgLz4KICA8cGF0aCBmaWxsPSIjNzk4OUQwIiBvcGFjaXR5PSIwLjgiIGQ9Ik0wLDUwMCBMMCwyOTAgQyAxMzAsMjcwIDI2MCwxMDAgNDUwLDEwMCBDIDY1MCwxMDAgODIwLDQwMCAxMDUwLDQwMCBDIDEyMjAsNDAwIDEzNDAsMjIwIDE0NDAsMjgwIEwxNDQwLDUwMCBaIiAvPgogIDxwYXRoIGZpbGw9IiM3OTlGRDAiIG9wYWNpdHk9IjAuNyIgZD0iTTAsNTAwIEwwLDMyMCBDIDE0MCwzMDAgMjgwLDE0MCA0NzAsMTQwIEMgNjcwLDE0MCA4NDAsNDIwIDEwNzAsNDIwIEMgMTI0MCw0MjAgMTM2MCwyNjAgMTQ0MCwzMjAgTDE0NDAsNTAwIFoiIC8+CiAgPHBhdGggZmlsbD0iIzc5QzREMCIgb3BhY2l0eT0iMC43IiBkPSJNMCw1MDAgTDAsMzUwIEMgMTUwLDMzMCAzMDAsMTgwIDQ5MCwxODAgQyA2OTAsMTgwIDg2MCw0NDAgMTA5MCw0NDAgQyAxMjYwLDQ0MCAxMzgwLDMwMCAxNDQwLDM2MCBMMTQ0MCw1MDAgWiIgLz4KPC9zdmc+")`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "300% auto",
      backgroundPosition: `${position} bottom`,
    };

    return (
      <div className="flex-1 min-w-0 h-[220px] rounded-[24px] overflow-hidden relative group transition-all duration-300">
        {/* Wave Background */}
        <div
          style={waveBgStyle}
          className="absolute inset-0 w-full h-full"
        />

        {/* Glass Overlay & Content Container with tinted glass in dark mode */}
        <div className="absolute inset-0 w-full h-full bg-white/30 dark:bg-[color-mix(in_srgb,var(--theme-accent)_8%,rgba(24,24,31,0.45))] backdrop-blur-[10px] border-[1px] border-[rgba(255,255,255,0.2)] dark:border-white/10 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.3)] rounded-[24px] flex flex-col items-center justify-start pt-6 pb-6 px-4 z-10">
          {/* Emoji Image/Component */}
          <div className="flex items-center justify-center w-[48px] h-[48px]">
            {emoji}
          </div>

          {/* Small muted gray label */}
          <p className="m-0 text-[14px] sm:text-[16px] font-medium text-zinc-500 dark:text-zinc-400 capitalize mt-2 sm:mt-3 tracking-wide">
            {label}
          </p>

          {/* Bold, darker text value */}
          <h3 className="m-0 text-[15px] sm:text-[18px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight mt-1.5 sm:mt-2 max-w-full text-center break-words line-clamp-2 px-1">
            {value}
          </h3>
        </div>
      </div>
    );
  };

  const majorEmoji = getMajorEmoji(major);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full ${className}`}>
      <DetailCard
        label="University"
        value={university}
        emoji={<img src="/assets/emojis/school.png" className="w-full h-full object-contain" alt="🏫" />}
        position="left"
      />
      <DetailCard
        label="Major"
        value={major}
        emoji={<img src={majorEmoji.src} className="w-full h-full object-contain" alt={majorEmoji.alt} />}
        position="center"
      />
      <DetailCard
        label="Status"
        value={year}
        emoji={<img src="/assets/emojis/calendar.png" className="w-full h-full object-contain" alt="🗓️" />}
        position="right"
      />
    </div>
  );
};

export default FrameComponent;

