# User journeys: SkillsFundingAgency/das-campaign

Generated from `master/src`: 23 pages, 3 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `Article.EmployerProfiles` | `/apprentices/employer-profiles` | Unknown | Displays employer profiles related to apprentices. |
| `Article.GetArticleAsync` | `/{hub}/{slug}` | Unknown | Shows a content article or landing page for the specified hub and slug. |
| `Article.TheRoadToAQualityApprenticeship` | `/employers/the-road-to-a-quality-apprenticeship` | Unknown | Displays information about achieving a quality apprenticeship for employers. |
| `Employer.ApprenticeshipBenefitsAndFunding` | `/employers/understanding-apprenticeship-benefits-and-funding` | Unknown | Allows employers to view and submit details about apprenticeship benefits, funding, and training. |
| `Employer.FindApprenticeshipTraining` | `/employers/find-apprenticeship-training` | Unknown | Redirects employers to an external service to find apprenticeship training. |
| `Fat.Apprenticeship` | `/employers/find-apprenticeships/apprenticeship` | Unknown | Redirects to external details for a specific apprenticeship. |
| `Fat.Search` | `/employers/find-apprenticeships` | Unknown | Redirects to an external apprenticeship course search. |
| `FundingAnApprenticeship.Index` | `employers/funding-an-apprenticeship` | Unknown | Lets employers indicate whether their annual pay bill is more than £3 million and view funding information. |
| `Home.Accessibility` | `accessibility` | Unknown | Displays accessibility information for the website. |
| `Home.CookieDetails` | `cookie-details` | Unknown | Shows detailed information about the site's cookie usage. |
| `Home.Cookies` | `cookies` | Unknown | Lets users review and set their cookie preferences. |
| `Home.Index` | `/` | Unknown | Displays the homepage of the website. |
| `Home.Privacy` | `privacy` | Unknown | Displays the website's privacy information to the user. |
| `Home.SiteMap` | `sitemap.xml` | Unknown | Returns an XML sitemap for the website. |
| `Home.Sitemap` | `sitemap` | Unknown | Displays the website's sitemap page to the user. |
| `Hub.GetHubAsync` | `/{hub}` | Unknown | Displays the content hub page for the specified hub. |
| `RegisterInterest.Index` | `register-interest` | Unknown | Lets the user register their interest by completing a form about their company and themselves. |
| `RegisterInterest.PreviousThankYouUrl` | `register-interest/employers/thank-you-for-signing-up` | Unknown | Redirects the user to the current thank you page after signing up. |
| `RegisterInterest.PreviousUrl` | `register-interest` | Unknown | Redirects the user to the current register interest page. |
| `RegisterInterest.ThankYouForRegistering` | `register-interest` | Unknown | Shows a thank you page after the user registers their interest. |
| `TrainingProvider.Details` | `/trainingprovider/details` | Unknown | Redirects to external training provider details for a selected apprenticeship. |
| `TrainingProvider.Search` | `/trainingprovider/search` | Unknown | Redirects to external training provider search for apprenticeships. |
| `TrainingProvider.ValidatePostcode` | `/trainingprovider/validate-postcode` | Unknown | Redirects to an external postcode validation or training provider site. |

## Form fields

Field definitions only: no values a user enters are recorded.

### `Employer.ApprenticeshipBenefitsAndFunding`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `PayBillGreaterThanThreeMillion` | radios | What is your annual pay bill? | Yes | required | — |
| `StandardUid` | select | What course do you want your apprentice to take? | Yes | required | — |
| `NumberOfRoles` | text | How many roles do you have available for this apprenticeship? | — | — | — |

### `FundingAnApprenticeship.Index`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `LevyStatus` | radios | As an employer, is your pay bill more than £3 million per year? | Yes | required | Yes, No, Not sure |

### `Home.Cookies`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `cookies-usage` | radios | Do you want to accept cookies that measure website use? | — | — | Yes, No |
| `cookies-campaigns` | radios | Do you want to accept cookies that help with our communications and marketing? | — | — | Yes, No |

### `RegisterInterest.Index`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SizeOfYourCompany` | radios | Your company size | Yes | required | Less than 10 employees, Between 10 and 49 employees, Between 50 and 249 employees, Over 250 employees |
| `Industry` | select | Your industry | Yes | required | — |
| `Location` | select | Your region | Yes | required | — |
| `FirstName` | text | First name | — | — | — |
| `LastName` | text | Last name | — | — | — |
| `Email` | text | Email address | — | — | — |
| `IncludeInUR` | checkboxes | I am happy to take part in research that'll help improve the Apprenticeship Service. | — | — | I am happy to take part in research that'll help improve the Apprenticeship Service. |

