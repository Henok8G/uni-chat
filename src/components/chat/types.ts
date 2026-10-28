/**
 * Shared types for the group chat sidebar UI components.
 */

export interface GroupItem {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Preview of the last message in this conversation */
  lastMessage?: string;
  /** Human-readable relative time, e.g. "2m ago" */
  lastMessageTime?: string;
  /** Number of unread messages */
  unreadCount?: number;
  /** Whether the other participant is currently online */
  isOnline?: boolean;
  /** "personal" chats between two users vs. "group" chats */
  kind?: "personal" | "group";
}

export interface FriendRequestItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderDepartment?: string | null;
  senderYear?: number | null;
  senderBio?: string | null;
  createdAt: string;
}
