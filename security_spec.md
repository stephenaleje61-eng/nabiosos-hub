# Security Specification & Test Payloads for NABIOSOS Hub

## 1. Data Invariants
- Users can only edit their own user profile document `/users/{userId}` where `request.auth.uid == userId`.
- User private data `/users/{userId}/private/info` can only be read and written by the document owner (`request.auth.uid == userId`).
- Spaces `/spaces/{spaceId}` are readable by all authenticated students. Spaces can only be created/updated by authorized admins.
- Group messages in `/spaces/{spaceId}/messages/{messageId}` can be created by authenticated users where `request.resource.data.authorId == request.auth.uid`. Messages cannot be edited except by the author or admins, and deletions are limited to author/admins.
- Direct chats `/directChats/{chatId}` and their messages `/directChats/{chatId}/messages/{messageId}` can only be read or written by the 2 participants declared in the conversation.
- Friend requests `/friendRequests/{requestId}`: Only `fromUserId` can create, and only `toUserId` or `fromUserId` can update/view.
- Friendships `/friends/{friendshipId}`: Only the two involved users (`user1Id` or `user2Id`) can access or create them upon acceptance.
- Notifications `/notifications/{notificationId}`: Can only be read, marked as read, or deleted by `recipientId == request.auth.uid`.
- Reports `/reports/{reportId}`: Any authenticated user can create a report with `reporterId == request.auth.uid`. Only admins can read all reports.
- Blocks `/blocks/{blockId}`: Only `blockerId == request.auth.uid` can create/delete their blocks.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Payload 1 (Impersonate Author in Space)**: `POST /spaces/microbiology/messages` with `authorId: "victim_123"` by `attacker_999`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Read Another User's Private Info)**: `GET /users/victim_123/private/info` by `attacker_999`. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Modify Another User's Profile)**: `UPDATE /users/victim_123` with `{ displayName: "Hacked" }` by `attacker_999`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Eavesdrop Direct Chat)**: `GET /directChats/userA_userB/messages/msg_1` by `eavesdropper_777`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Send Direct Message into Chat where not a participant)**: `POST /directChats/userA_userB/messages` by `eavesdropper_777`. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Accept Friend Request on Behalf of Someone Else)**: `UPDATE /friendRequests/req_1` with `{ status: "accepted" }` by a 3rd party. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Oversized Message String Attack - Denial of Wallet)**: `POST /spaces/announcements/messages` with 50,000 character junk text. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Read Another User's Notifications)**: `GET /notifications/notif_of_victim` by `attacker_999`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Unauthenticated Space Access)**: `GET /spaces/microbiology/messages` without auth. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Create Space with Arbitrary Privilege Escalation)**: `POST /spaces/fake_space` by normal user. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Fabricate Friendship without Mutual Acceptance)**: `POST /friends/userA_userB` by unrelated `userC`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Delete Space Message posted by Someone Else)**: `DELETE /spaces/microbiology/messages/msg_1` by non-author. Expected: `PERMISSION_DENIED`.
