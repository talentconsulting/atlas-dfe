# User journeys: SkillsFundingAgency/das-campaign

Generated from `master/src`: 23 pages, 3 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `Article.EmployerProfiles` | `/apprentices/employer-profiles` | Unknown | Shows employer profiles related to apprenticeships. |
| `Article.GetArticleAsync` | `/{hub}/{slug}` | Unknown | Displays an article or landing page based on the hub and slug in the URL. |
| `Article.TheRoadToAQualityApprenticeship` | `/employers/the-road-to-a-quality-apprenticeship` | Unknown | Shows information about the pathway to a quality apprenticeship for employers. |
| `Employer.ApprenticeshipBenefitsAndFunding` | `/employers/understanding-apprenticeship-benefits-and-funding` | Unknown | Lets employers explore apprenticeship benefits and funding options, and calculate potential outcomes by completing a form. |
| `Employer.FindApprenticeshipTraining` | `/employers/find-apprenticeship-training` | Unknown | Redirects employers to an external apprenticeship training finder. |
| `Fat.Apprenticeship` | `/employers/find-apprenticeships/apprenticeship` | Unknown | Redirects to an external apprenticeship course details page. |
| `Fat.Search` | `/employers/find-apprenticeships` | Unknown | Redirects to an external apprenticeship search page. |
| `FundingAnApprenticeship.Index` | `employers/funding-an-apprenticeship` | Unknown | Lets employers specify whether their pay bill is over £3 million to determine funding information. |
| `Home.Accessibility` | `accessibility` | Unknown | Provides information about the site's accessibility. |
| `Home.CookieDetails` | `cookie-details` | Unknown | Displays details about the site's use of cookies. |
| `Home.Cookies` | `cookies` | Unknown | Lets users set their cookie preferences for the site. |
| `Home.Index` | `/` | Unknown | Displays the main homepage of the site. |
| `Home.Privacy` | `privacy` | Unknown | Displays information about privacy. |
| `Home.SiteMap` | `sitemap.xml` | Unknown | Returns the XML sitemap for the website. |
| `Home.Sitemap` | `sitemap` | Unknown | Displays the site's sitemap to help users navigate the site. |
| `Hub.GetHubAsync` | `/{hub}` | Unknown | Shows the specified hub page, or a not-found error if it does not exist. |
| `RegisterInterest.Index` | `register-interest` | Unknown | Lets users register their interest as an employer by submitting details about their company, industry, location, and contact information. |
| `RegisterInterest.PreviousThankYouUrl` | `register-interest/employers/thank-you-for-signing-up` | Unknown | Redirects users to the thank you page after signing up as an employer. |
| `RegisterInterest.PreviousUrl` | `register-interest` | Unknown | Redirects users to the register interest page. |
| `RegisterInterest.ThankYouForRegistering` | `register-interest` | Unknown | Shows a thank you message after users have registered their interest. |
| `TrainingProvider.Details` | `/trainingprovider/details` | Unknown | Redirects to detailed information for a selected apprenticeship training provider. |
| `TrainingProvider.Search` | `/trainingprovider/search` | Unknown | Redirects to a search page for apprenticeship training providers. |
| `TrainingProvider.ValidatePostcode` | `/trainingprovider/validate-postcode` | Unknown | Validates a postcode and redirects, typically used to check provider coverage. |

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

