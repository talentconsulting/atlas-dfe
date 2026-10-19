# User journeys: SkillsFundingAgency/das-providerapprenticeshipsservice

Generated from `master/src`: 14 pages, 5 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `Accessibility` | `accessibility` | Unknown | Provides information on the accessibility of the website. |
| `Account.ChangeSignInDetails` | `~/change-signin-details` | Yes | Allows the user to view or change their sign-in details. |
| `AccountHome` | `~/account` | Yes | Displays the user's account home page with account status and information. |
| `GetNotificationSettings` | `~/notification-settings` | Yes | Shows the user's notification settings and allows configuration of notification preferences. |
| `Home` | `/` | Unknown | Displays the application's start page or home screen. |
| `Home.Help` | `help` | Unknown | Provides help or support information for users. |
| `PostNotificationSettings` | `~/notification-settings` | Yes | Processes updates to the user's notification settings. |
| `SignIn` | `~/signin` | Yes | Processes user sign-in and redirects after authentication. |
| `UnsubscribeNotifications` | `~/notifications/unsubscribe` | Yes | Lets the user unsubscribe from notifications. |
| `cookie-details` | `cookie-details` | Unknown | Shows detailed information about cookies used by the site. |
| `cookies` | `cookies` | Unknown | Displays the cookies settings page, allowing users to adjust cookie preferences. |
| `privacy` | `privacy` | Unknown | Displays the privacy policy for the website. |
| `signed-out` | `~/signed-out` | No | Informs the user that they have been signed out. |
| `terms` | `terms` | Unknown | Displays the terms and conditions for using the website. |

## Form fields

Field definitions only: no values a user enters are recorded.

### `GetNotificationSettings`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `NotificationSettings[i].ReceiveNotifications` | radios | — | — | — | — |

### `cookies`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `cookies-AnalyticsConsent` | radios | Cookies that measure website use | — | — | Use cookies that measure my service use, Do not use cookies that measure my service use |

