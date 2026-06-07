export type Announcement = {
    id: number;
    text: string;
    createdAt: string;
};

type AnnouncementsResponse = {
    announcements: Announcement[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const getAnnouncements = async (signal?: AbortSignal): Promise<Announcement[]> => {
    const response = await fetch(`${apiBaseUrl}/api/announcements`, { signal });

    if (!response.ok) {
        throw new Error("Unable to load announcements.");
    }

    const data = (await response.json()) as AnnouncementsResponse;
    return data.announcements;
};
