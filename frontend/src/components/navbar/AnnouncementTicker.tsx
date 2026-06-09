import type { Announcement } from "../../services/announcements";

type AnnouncementTickerProps = {
    announcement: Announcement;
    announcements?: Announcement[];
    compact?: boolean;
};

const AnnouncementTicker = ({
    announcement,
    announcements = [announcement],
    compact = false,
}: AnnouncementTickerProps) => (
    <aside
        aria-label="Store announcements"
        aria-live="polite"
        className={`flex min-w-0 items-center overflow-hidden ${
            compact ? "mb-2 py-1.5" : "w-full py-1.5"
        }`}
    >
        <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-xs font-semibold text-pine sm:text-sm">
            <div className="announcement-stream-track flex w-max items-center">
                {[false, true].map((duplicate) => (
                    <div
                        key={duplicate ? "duplicate" : "original"}
                        aria-hidden={duplicate || undefined}
                        className="announcement-stream-group flex shrink-0 items-center"
                    >
                        {announcements.map((item) => (
                            <span key={item.id} className="inline-flex items-center">
                                <span
                                    className={`inline-block h-1 w-1 rounded-full bg-rose-300 ${
                                        compact ? "mx-5" : "mx-10"
                                    }`}
                                />
                                {item.text}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </aside>
);

export default AnnouncementTicker;
