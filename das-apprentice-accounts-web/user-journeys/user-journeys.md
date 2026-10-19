# User journeys: SkillsFundingAgency/das-apprentice-accounts-web

Generated from `main/src`: 7 pages, 1 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `/Account` | `/account` | Yes | Lets the apprentice create or update their account personal details, including name and date of birth. |
| `/ChangeYourSignInDetails` | `/signin-details` | Yes | Informs the user that sign-in details can be changed via GOV.UK One Login and provides a link to do so. |
| `/NotificationSettings` | `/NotificationSettings` | Yes | Allows the apprentice to update their notification preferences. |
| `/SignOut` | `/SignOut` | Yes | Signs the user out of the application. |
| `/TermsOfUse` | `/TermsOfUse` | No | Lets the apprentice accept the terms and conditions required to use the service. |
| `Profile.AcceptTermsOfUse` | `/AcceptTermsOfUse` | Yes | Redirects the user to the terms of use page for acceptance. |
| `Profile.Confirm` | `/profile/{clientId}/changeemail/confirm` | Yes | Redirects the user to a confirmation endpoint after changing their email address. |

## Form fields

Field definitions only: no values a user enters are recorded.

### `/Account`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `FirstName` | text | First name | — | required; must be valid as determined by domain validation (details not shown) | — |
| `LastName` | text | Last name | — | required; must be valid as determined by domain validation (details not shown) | — |
| `DateOfBirth.Day` | text | Day | — | required; must be valid as part of a complete date according to domain validation | — |
| `DateOfBirth.Month` | text | Month | — | required; must be valid as part of a complete date according to domain validation | — |
| `DateOfBirth.Year` | text | Year | — | required; must be valid as part of a complete date according to domain validation | — |

### `/NotificationSettings`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `Model[i].Status` | radios | — | — | — | — |

### `/TermsOfUse`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `TermsOfUseAccepted` | checkboxes | — | Yes | required | — |

