export interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string;
  department: string;
  level: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatSpaceInfo {
  id: string;
  name: string;
  category: 'department' | 'general';
  department?: string;
  level?: string;
  description: string;
  icon: string;
  badgeColor?: string;
}

export interface SpaceMessage {
  id: string;
  spaceId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorDepartment?: string;
  authorLevel?: string;
  text: string;
  replyToId?: string;
  replyToText?: string;
  replyToAuthor?: string;
  likesCount?: number;
  likedBy?: string[];
  createdAt: string;
}

export interface DirectChat {
  id: string;
  participants: string[];
  participantIds: string;
  participantDetails?: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
      department?: string;
      level?: string;
    };
  };
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  replyToId?: string;
  replyToText?: string;
  replyToAuthor?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL?: string;
  fromUserDepartment?: string;
  fromUserLevel?: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message' | 'announcement';
  title: string;
  body: string;
  linkId?: string;
  read: boolean;
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  targetType: 'message' | 'space_message' | 'user';
  targetId: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}
