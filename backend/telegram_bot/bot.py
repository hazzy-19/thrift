import asyncio
import logging
from time import perf_counter
from collections.abc import Collection

import httpx

from .database import (
    clear_announcements,
    create_announcement,
    delete_announcement,
    get_announcement,
    list_announcements,
    set_announcement_active,
)
from .models import TelegramCallbackQuery, TelegramMessage, TelegramUpdate


logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)

HELP_TEXT = """Announcement commands:
/add <message> - add an announcement
/list - manage all announcements
/delete <id> - delete an announcement
/enable <id> - show an announcement
/disable <id> - hide an announcement
/clear - delete all announcements
/whoami - show your Telegram IDs
/help - show this guide

You can also send normal text to add it as an announcement."""

SETUP_TEXT = """This bot manages website announcements.

Send /whoami to get your Telegram IDs, then add one of them to
TELEGRAM_ALLOWED_CHAT_IDS and restart the backend."""

CONTROL_PANEL_TEXT = """Announcement control panel

Choose what you want to do."""

CONTROL_PANEL_KEYBOARD = [
    [
        {"text": "Add announcement", "callback_data": "panel:add"},
        {"text": "View all", "callback_data": "panel:list"},
    ],
    [
        {"text": "Delete", "callback_data": "panel:delete"},
        {"text": "Enable", "callback_data": "panel:enable"},
        {"text": "Disable", "callback_data": "panel:disable"},
    ],
    [
        {"text": "Clear all", "callback_data": "panel:clear"},
        {"text": "Help", "callback_data": "panel:help"},
    ],
]


class TelegramBot:
    def __init__(self, token: str, allowed_ids: Collection[int]) -> None:
        self.allowed_ids = frozenset(allowed_ids)
        self.api_url = f"https://api.telegram.org/bot{token}"
        self.client = httpx.AsyncClient(timeout=40)
        self.pending_actions: dict[int, str] = {}

        if not self.allowed_ids:
            logger.warning(
                "TELEGRAM_ALLOWED_CHAT_IDS is empty. Announcement updates are blocked; "
                "use /whoami to discover your ID."
            )

    async def close(self) -> None:
        await self.client.aclose()

    async def handle_update(self, update: TelegramUpdate) -> None:
        started_at = perf_counter()
        if update.callback_query:
            await self._handle_callback(update.callback_query)
        elif update.message:
            await self._handle_message(update.message)
        logger.info("Telegram update handled in %.3f seconds", perf_counter() - started_at)

    async def _handle_message(self, message: TelegramMessage) -> None:
        if (message.from_user is not None and message.from_user.is_bot) or not message.text:
            return

        text = message.text.strip()
        user_id = message.from_user.id if message.from_user else message.chat.id
        command, argument = self._parse_command(text)

        if command == "/whoami":
            await self.send_message(
                message.chat.id,
                f"Your chat ID is: {message.chat.id}\nYour user ID is: {user_id}",
            )
            return

        if command == "/start":
            if self._is_allowed(message.chat.id, user_id):
                self.pending_actions.pop(user_id, None)
                await self._send_control_panel(message.chat.id)
            else:
                await self.send_message(message.chat.id, SETUP_TEXT)
            return

        if not self._is_allowed(message.chat.id, user_id):
            return

        try:
            if command:
                self.pending_actions.pop(user_id, None)

            if command == "/help":
                await self.send_message(message.chat.id, HELP_TEXT)
                await self._send_control_panel(message.chat.id)
            elif command == "/list":
                await self._send_announcement_list(message.chat.id)
            elif command == "/add":
                if argument:
                    await self._add(message.chat.id, user_id, argument)
                else:
                    await self._prompt_for_announcement(message.chat.id, user_id)
            elif command == "/delete":
                await self._delete(message.chat.id, argument)
            elif command == "/enable":
                await self._toggle(message.chat.id, argument, True)
            elif command == "/disable":
                await self._toggle(message.chat.id, argument, False)
            elif command == "/clear":
                await self.send_message(
                    message.chat.id,
                    "Delete every announcement?",
                    inline_keyboard=[
                        [
                            {"text": "Yes, clear all", "callback_data": "clear:confirm"},
                            {"text": "Cancel", "callback_data": "clear:cancel"},
                        ]
                    ],
                )
            elif command:
                await self.send_message(message.chat.id, "Unknown command. Use /help.")
            elif self.pending_actions.get(user_id) == "add":
                await self._add(message.chat.id, user_id, text)
                self.pending_actions.pop(user_id, None)
                await self._send_control_panel(message.chat.id)
            else:
                await self._add(message.chat.id, user_id, text)
        except ValueError as error:
            await self.send_message(message.chat.id, str(error))

    async def _handle_callback(self, callback: TelegramCallbackQuery) -> None:
        chat_id = callback.message.chat.id if callback.message else callback.from_user.id
        if not self._is_allowed(chat_id, callback.from_user.id):
            return

        data = callback.data or ""
        action = ""
        await self.answer_callback(callback.id, "Working...")
        try:
            action, raw_id = data.split(":", 1)
            if action == "panel":
                await self._handle_panel_action(chat_id, callback.from_user.id, raw_id)
                message = ""
            elif action == "delete":
                message = "Deleted." if delete_announcement(int(raw_id)) else "Announcement not found."
            elif action == "enable":
                message = "Enabled." if set_announcement_active(int(raw_id), True) else "Announcement not found."
            elif action == "disable":
                message = "Disabled." if set_announcement_active(int(raw_id), False) else "Announcement not found."
            elif action == "preview":
                announcement = get_announcement(int(raw_id))
                message = announcement["text"] if announcement else "Announcement not found."
            elif action == "clear" and raw_id == "confirm":
                message = f"Deleted {clear_announcements()} announcements."
            elif action == "clear" and raw_id == "cancel":
                message = "Clear cancelled."
            else:
                message = "Unknown action."
        except (ValueError, TypeError):
            message = "Invalid action."

        if message and action == "preview":
            await self.send_message(chat_id, message, inline_keyboard=self._back_keyboard())
        elif message and action not in {"panel"}:
            await self.send_message(chat_id, message)
        if action in {"delete", "enable", "disable"}:
            await self._send_action_list(chat_id, action)
        elif action == "clear":
            await self._send_control_panel(chat_id)

    async def _add(self, chat_id: int, created_by: int, text: str) -> None:
        if not text:
            raise ValueError("Usage: /add <message>")
        announcement = create_announcement(text, created_by)
        await self.send_message(chat_id, f"Added announcement #{announcement['id']}.")

    async def _delete(self, chat_id: int, raw_id: str) -> None:
        announcement_id = self._parse_id(raw_id, "/delete")
        await self.send_message(
            chat_id,
            "Deleted." if delete_announcement(announcement_id) else "Announcement not found.",
        )

    async def _toggle(self, chat_id: int, raw_id: str, active: bool) -> None:
        command = "/enable" if active else "/disable"
        announcement_id = self._parse_id(raw_id, command)
        changed = set_announcement_active(announcement_id, active)
        await self.send_message(
            chat_id,
            ("Enabled." if active else "Disabled.") if changed else "Announcement not found.",
        )

    async def _send_announcement_list(self, chat_id: int) -> None:
        await self._send_action_list(chat_id, "list")

    async def _send_action_list(self, chat_id: int, action: str) -> None:
        announcements = list_announcements()
        if action == "enable":
            announcements = [item for item in announcements if not item["active"]]
        elif action == "disable":
            announcements = [item for item in announcements if item["active"]]

        if not announcements:
            label = {
                "delete": "No announcements available to delete.",
                "enable": "No disabled announcements available.",
                "disable": "No enabled announcements available.",
            }.get(action, "No announcements yet.")
            await self.send_message(chat_id, label, inline_keyboard=self._back_keyboard())
            return

        heading = {
            "delete": "Select an announcement to delete:",
            "enable": "Select an announcement to enable:",
            "disable": "Select an announcement to disable:",
        }.get(action, f"{len(announcements)} announcements:")
        await self.send_message(chat_id, heading)

        for announcement in announcements:
            announcement_id = announcement["id"]
            active = bool(announcement["active"])
            status = "Enabled" if active else "Disabled"
            preview = str(announcement["text"])
            if len(preview) > 80:
                preview = f"{preview[:77]}..."
            toggle_action = "disable" if active else "enable"
            toggle_label = "Disable" if active else "Enable"
            if action == "delete":
                buttons = [{"text": "Delete", "callback_data": f"delete:{announcement_id}"}]
            elif action == "enable":
                buttons = [{"text": "Enable", "callback_data": f"enable:{announcement_id}"}]
            elif action == "disable":
                buttons = [{"text": "Disable", "callback_data": f"disable:{announcement_id}"}]
            else:
                buttons = [
                    {"text": toggle_label, "callback_data": f"{toggle_action}:{announcement_id}"},
                    {"text": "Preview", "callback_data": f"preview:{announcement_id}"},
                    {"text": "Delete", "callback_data": f"delete:{announcement_id}"},
                ]
            await self.send_message(
                chat_id,
                f"#{announcement_id} [{status}]\n{preview}",
                inline_keyboard=[buttons],
            )
        await self.send_message(chat_id, "Choose another action:", inline_keyboard=self._back_keyboard())

    async def _handle_panel_action(self, chat_id: int, user_id: int, action: str) -> None:
        self.pending_actions.pop(user_id, None)
        if action == "add":
            await self._prompt_for_announcement(chat_id, user_id)
        elif action in {"list", "delete", "enable", "disable"}:
            await self._send_action_list(chat_id, action)
        elif action == "clear":
            await self.send_message(
                chat_id,
                "Delete every announcement?",
                inline_keyboard=[
                    [
                        {"text": "Yes, clear all", "callback_data": "clear:confirm"},
                        {"text": "Cancel", "callback_data": "panel:home"},
                    ]
                ],
            )
        elif action == "help":
            await self.send_message(chat_id, HELP_TEXT, inline_keyboard=self._back_keyboard())
        else:
            await self._send_control_panel(chat_id)

    async def _prompt_for_announcement(self, chat_id: int, user_id: int) -> None:
        self.pending_actions[user_id] = "add"
        await self.send_message(
            chat_id,
            "Enter the breaking news announcement.",
            inline_keyboard=self._back_keyboard(),
        )

    async def _send_control_panel(self, chat_id: int) -> None:
        await self.send_message(chat_id, CONTROL_PANEL_TEXT, inline_keyboard=CONTROL_PANEL_KEYBOARD)

    @staticmethod
    def _back_keyboard() -> list[list[dict[str, str]]]:
        return [[{"text": "Back to control panel", "callback_data": "panel:home"}]]

    async def send_message(
        self,
        chat_id: int,
        text: str,
        inline_keyboard: list[list[dict[str, str]]] | None = None,
    ) -> None:
        payload: dict[str, object] = {"chat_id": chat_id, "text": text}
        if inline_keyboard:
            payload["reply_markup"] = {"inline_keyboard": inline_keyboard}
        response = await self.client.post(f"{self.api_url}/sendMessage", json=payload)
        self._ensure_success(response)

    async def answer_callback(self, callback_id: str, text: str) -> None:
        response = await self.client.post(
            f"{self.api_url}/answerCallbackQuery",
            json={"callback_query_id": callback_id, "text": text, "show_alert": False},
        )
        self._ensure_success(response)

    async def set_webhook(self, webhook_url: str, secret: str) -> None:
        response = await self.client.post(
            f"{self.api_url}/setWebhook",
            json={
                "url": webhook_url,
                "secret_token": secret,
                "allowed_updates": ["message", "callback_query"],
                "drop_pending_updates": False,
            },
        )
        self._ensure_success(response)

    async def delete_webhook(self) -> None:
        response = await self.client.post(
            f"{self.api_url}/deleteWebhook",
            json={"drop_pending_updates": False},
        )
        self._ensure_success(response)

    async def poll_forever(self) -> None:
        await self.delete_webhook()
        logger.info("Telegram bot running in polling mode")
        offset = 0

        while True:
            try:
                response = await self.client.get(
                    f"{self.api_url}/getUpdates",
                    params={
                        "timeout": 30,
                        "offset": offset,
                        "allowed_updates": '["message","callback_query"]',
                    },
                )
                self._ensure_success(response)
                for raw_update in response.json()["result"]:
                    offset = raw_update["update_id"] + 1
                    await self.handle_update(TelegramUpdate.model_validate(raw_update))
            except asyncio.CancelledError:
                raise
            except Exception as error:
                logger.error(
                    "Telegram polling error (%s); retrying in 5 seconds",
                    type(error).__name__,
                )
                await asyncio.sleep(5)

    def _is_allowed(self, chat_id: int, user_id: int) -> bool:
        return bool(self.allowed_ids) and (
            chat_id in self.allowed_ids or user_id in self.allowed_ids
        )

    @staticmethod
    def _parse_command(text: str) -> tuple[str, str]:
        if not text.startswith("/"):
            return "", text
        parts = text.split(maxsplit=1)
        command = parts[0].split("@")[0].lower()
        return command, parts[1].strip() if len(parts) > 1 else ""

    @staticmethod
    def _parse_id(raw_id: str, command: str) -> int:
        try:
            return int(raw_id.strip())
        except ValueError as error:
            raise ValueError(f"Usage: {command} <id>") from error

    @staticmethod
    def _ensure_success(response: httpx.Response) -> None:
        if response.is_error:
            raise RuntimeError(f"Telegram API request failed with status {response.status_code}.")
