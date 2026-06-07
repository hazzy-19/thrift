import { BellRing } from "lucide-react";
import type { Announcement } from "../../services/announcements";

type AnnouncementTickerProps = {
    announcement: Announcement;
    total: number;
    compact?: boolean;
};

const AnnouncementTicker = ({
    announcement,
    total,
    compact = false,
}: AnnouncementTickerProps) => (
    <aside
        aria-label="Store announcements"
        aria-live="polite"
        className={`flex min-w-0 items-center gap-2 overflow-hidden ${
            compact ? "mx-3 mb-2 px-3 py-1.5" : "max-w-lg px-3 py-1.5"
        }`}
    >
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <BellRing aria-hidden="true" className="h-3 w-3 text-white" />
            Remember
        </span>
        <p
            key={announcement.id}
            className={`min-w-0 flex-1 truncate text-xs font-semibold text-pine sm:text-sm ${
                total > 1 ? "announcement-ticker-rotating" : ""
            }`}
        >
            {announcement.text}
        </p>
    </aside>
);

export default AnnouncementTicker;
