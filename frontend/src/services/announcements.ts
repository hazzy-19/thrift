export type Announcement = {
    message: string;
    updated_at: string;
};

type CurrentAnnouncementResponse = {
    announcement: Announcement | null;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const getCurrentAnnouncement = async (signal?: AbortSignal): Promise<Announcement | null> => {
    const response = await fetch(`${apiBaseUrl}/api/announcements/current`, { signal });

    if (!response.ok) {
        throw new Error("Unable to load announcement.");
    }

    const data = (await response.json()) as CurrentAnnouncementResponse;
    return data.announcement;
};
