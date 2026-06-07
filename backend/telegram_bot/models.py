from pydantic import BaseModel, Field


class TelegramChat(BaseModel):
    id: int


class TelegramUser(BaseModel):
    id: int
    is_bot: bool = False


class TelegramMessage(BaseModel):
    message_id: int
    text: str | None = None
    chat: TelegramChat
    from_user: TelegramUser | None = Field(default=None, alias="from")


class TelegramCallbackQuery(BaseModel):
    id: str
    data: str | None = None
    from_user: TelegramUser = Field(alias="from")
    message: TelegramMessage | None = None


class TelegramUpdate(BaseModel):
    update_id: int | None = None
    message: TelegramMessage | None = None
    callback_query: TelegramCallbackQuery | None = None


class PublicAnnouncement(BaseModel):
    id: int
    text: str
    createdAt: str


class AnnouncementsResponse(BaseModel):
    announcements: list[PublicAnnouncement]
