from pydantic import BaseModel, Field


class TelegramChat(BaseModel):
    id: int


class TelegramUser(BaseModel):
    is_bot: bool = False


class TelegramMessage(BaseModel):
    text: str | None = None
    chat: TelegramChat
    from_user: TelegramUser | None = Field(default=None, alias="from")


class TelegramUpdate(BaseModel):
    message: TelegramMessage | None = None


class Announcement(BaseModel):
    message: str
    updated_at: str


class CurrentAnnouncementResponse(BaseModel):
    announcement: Announcement | None
