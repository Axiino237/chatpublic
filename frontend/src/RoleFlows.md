# LOVELINK: Journey across all Roles

A detailed guide through the authentication, core interaction, and moderation cycles for every type of user in the LOVELINK ecosystem.

---

## 1. The Onboarding (All Users)

Every journey begins at the **Identity Creation** phase.

- **Account Creation**: Users provide basic details (Email, Name, DOB, Password).
- **Security Check**: The system validates age (18+) and checks for IP/Device bans.
- **Verification**: A 6-digit OTP is sent via email to verify the user's identity.
- **Role Assignment**: By default, users are assigned the `user` role. Admins can upgrade users to `vip`, `monitor`, or other admins.

---

## 2. The Explorer Flow (Regular User / VIP)

The primary experience for the community.

### Step 1: Login & Redirect
Users land on the **LobbyPage** after successful authentication.

### Step 2: Room Selection
Users browse active rooms (General, VIP Lounge, Gaming, etc.) and join a community.

### Step 3: Social Hub Interaction
Once inside a room (`PublicChatPage`):
- **Public Chat**: Send messages to the room.
- **Mentions**: Tag users (e.g., `@username`) to trigger notifications.
- **Whispers**: Securely message a user inside the public room (visible only to the pair).
- **Friends Sidebar**: Manage mutual connections and start direct chats.

### Step 4: Safety & Personalization
- **Profile Modal**: View own/others' public profiles with accurate age calculation.
- **Global Ignore**: Click "Ignore User" from context menus to silence all their messages globally.
- **Report User**: Submit detailed safety reports to administrators.

---

## 3. The Guardian Flow (Monitor)

Staff members dedicated to real-time oversight.

### Step 1: Monitor Access
Monitors are redirected or can navigate to `/monitor`.

### Step 2: Live Oversight
- **Global Feed**: A real-time stream of all public messages across the platform.
- **User Inspection**: Click any user to see their basic profile and recent public activity.
- **Safety Flags**: Receive alerts for potential violations or links/socials sharing.

---

## 4. The Architect Flow (Administrator)

Total system control and policy enforcement.

### Step 1: Admin Entry
Admins land directly on the **AdminPage** after login.

### Step 2: System Control
- **Control Overview**: Dashboard showing total users, online status, and active reports.
- **User Manager**: Search, verify, or suspend accounts platform-wide.
- **Safety Reports**: Review reports from the community, mark them as resolved, or take action against violators.
- **System Settings**: Toggle session controls or broadcast emergency announcements system-wide.

---

## 5. The Exit (Logout)

Secure session termination.

- **Action**: Users click "Logout" in the Header.
- **Processing**: The backend invalidates the refresh token and clears the `hashedRefreshToken`.
- **Cleanup**: Frontend clears local storage and redirects to the Login page.
- **Socket Disconnect**: Real-time connections are severed to ensure the user is marked offline.
