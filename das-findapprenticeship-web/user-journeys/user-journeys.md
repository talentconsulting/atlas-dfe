# User journeys: SkillsFundingAgency/das-findapprenticeship-web

Generated from `main/src`: 84 pages, 223 transitions, 8 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Search and Apply for an Apprenticeship

The user searches for apprenticeship vacancies, reviews details, and applies for a vacancy.

```mermaid
flowchart LR
  p0["ServiceStartDefault"] -->|"when search is valid"| p1["SearchResults"]
  p1["SearchResults"] --> p2["Vacancies"]
  p2["Vacancies"] --> p3["Apply 🔒"]
```

## Complete and Submit an Apprenticeship Application

The user completes all sections of the application and submits it.

Complete the sections in any order, returning to the hub.

```mermaid
flowchart LR
  p0["Apply 🔒"] --> p1["Qualifications 🔒"]
  p1["Qualifications 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p2["TrainingCourses 🔒"]
  p2["TrainingCourses 🔒"] -.->|"when section is marked complete or no courses to add"| p0["Apply 🔒"]
  p0["Apply 🔒"] --> p3["Jobs 🔒"]
  p3["Jobs 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p4["VolunteeringAndWorkExperience 🔒"]
  p4["VolunteeringAndWorkExperience 🔒"] -.->|"if the user chooses not to add volunteering or work experience"| p0["Apply 🔒"]
  p0["Apply 🔒"] --> p5["SkillsAndStrengths 🔒"]
  p5["SkillsAndStrengths 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p6["WhatInterestsYou 🔒"]
  p6["WhatInterestsYou 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p7["AddAdditionalQuestion 🔒"]
  p7["AddAdditionalQuestion 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p8["InterviewAdjustments 🔒"]
  p8["InterviewAdjustments 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p9["DisabilityConfident 🔒"]
  p9["DisabilityConfident 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p10["AddEmploymentLocations 🔒"]
  p10["AddEmploymentLocations 🔒"] -.-> p0["Apply 🔒"]
  p0["Apply 🔒"] --> p11["Preview 🔒"]
  p11["Preview 🔒"] -->|"after submitting the application"| p12["ApplicationSubmitted 🔒"]
```

## Complete Equality and Diversity Questions After Application

After submitting an application, the user answers equality and diversity questions.

```mermaid
flowchart LR
  p0["ApplicationSubmitted 🔒"] -->|"if 'AnswerEqualityQuestions' is true"| p1["EqualityFlowGender 🔒"]
  p1["EqualityFlowGender 🔒"] -->|"after saving the form (not in edit mode)"| p2["EqualityFlowEthnicGroup 🔒"]
```

## Manage and Withdraw Apprenticeship Applications

The user reviews, views, deletes, or withdraws their apprenticeship applications.

Complete the sections in any order, returning to the hub.

```mermaid
flowchart LR
  p0["ViewApplications 🔒"] --> p1["ViewApplication 🔒"]
  p1["ViewApplication 🔒"] -.-> p0["ViewApplications 🔒"]
  p0["ViewApplications 🔒"] --> p2["DeleteApplication 🔒"]
  p2["DeleteApplication 🔒"] -.-> p0["ViewApplications 🔒"]
  p0["ViewApplications 🔒"] --> p3["WithdrawApplication 🔒"]
  p3["WithdrawApplication 🔒"] -.-> p0["ViewApplications 🔒"]
```

## Manage Account Settings

The user updates their personal details, notification preferences, or requests account deletion.

Complete the sections in any order, returning to the hub.

```mermaid
flowchart LR
  p0["Settings 🔒"] --> p1["UserName 🔒"]
  p0["Settings 🔒"] --> p2["DateOfBirth 🔒"]
  p0["Settings 🔒"] --> p3["PostcodeAddress 🔒"]
  p0["Settings 🔒"] --> p4["EnterAddressManually 🔒"]
  p0["Settings 🔒"] --> p5["PhoneNumber 🔒"]
  p0["Settings 🔒"] --> p6["Email 🔒"]
  p0["Settings 🔒"] --> p7["EditEqualityQuestions 🔒"]
  p0["Settings 🔒"] --> p8["NotificationPreferences 🔒"]
  p0["Settings 🔒"] --> p9["ConfirmAccountDelete 🔒"]
  p9["ConfirmAccountDelete 🔒"] -.-> p0["Settings 🔒"]
  p0["Settings 🔒"] --> p10["SavedSearches 🔒"]
  p10["SavedSearches 🔒"] -.-> p0["Settings 🔒"]
```

## Browse Apprenticeships by Interests or Location

The user browses apprenticeship vacancies by interests or location to view search results.

```mermaid
flowchart LR
  p0["ServiceStartDefault"] --> p1["BrowseByInterests"]
  p1["BrowseByInterests"] -->|"after submitting valid job category selection"| p2["Location"]
  p2["Location"] -->|"after submitting valid location or national selection"| p3["SearchResults"]
```

## Request Account Deletion

The user requests account deletion, withdraws applications if needed, and confirms deletion.

```mermaid
flowchart LR
  p0["Settings 🔒"] --> p1["ConfirmAccountDelete 🔒"]
  p1["ConfirmAccountDelete 🔒"] --> p2["AccountDeleteWithDrawApplication 🔒"]
  p2["AccountDeleteWithDrawApplication 🔒"] --> p3["AccountDelete 🔒"]
```

## Unsubscribe from Saved Search Notifications

The user unsubscribes from saved search notifications and receives confirmation.

```mermaid
flowchart LR
  p0["GetSavedSearchesUnsubscribe"] --> p1["ConfirmDeleteSavedSearch 🔒"]
  p1["ConfirmDeleteSavedSearch 🔒"] --> p2["SavedSearches 🔒"]
```

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `AccessibilityStatement` | `accessibility-statement` | No | Shows the service accessibility statement. |
| `AccountDelete` | `account-delete` | Yes | Lets the user request deletion of their account by confirming their email address. |
| `AccountDeleteWithDrawApplication` | `account-deletion-withdraw-applications` | Yes | Lets the user review and withdraw applications before deleting their account. |
| `AccountUnavailable` | `account-unavailable` | Yes | Informs the user that their account is unavailable. |
| `Applications.DeleteApplication` | `applications/{applicationId}/delete`, `applications/{applicationId:guid}/delete` | Yes | Lets the user delete an apprenticeship application. |
| `Applications.ViewApplication` | `applications/{applicationId}/view` | Yes | Shows the details of a single apprenticeship application. |
| `Applications.ViewApplications` | `applications` | Yes | Shows a list of all apprenticeship applications for the user. |
| `Applications.WithdrawApplication` | `applications/{applicationId:guid}/withdraw`, `applications/{applicationId}/withdraw` | Yes | Lets the user withdraw an apprenticeship application. |
| `Apply` | `applications/{applicationId}` | Yes | Shows the applicant a summary of their apprenticeship application. |
| `ApplyApprenticeship.AddAdditionalQuestion` | `apply/{applicationId}/additional-question/{additionalQuestion}/{additionalQuestionId}` | Yes | Lets the user answer an additional question for their apprenticeship application. |
| `ApplyApprenticeship.AddEmploymentLocations` | `apply/{applicationId:guid}/employmentLocations` | Yes | Lets the applicant select the locations where they want to apply for an apprenticeship. |
| `ApplyApprenticeship.AddJob` | `apply/{applicationId}/jobs/add` | Yes | Lets the applicant add a new job to their work history. |
| `ApplyApprenticeship.AddQualification` | `apply/{applicationId}/qualifications/{qualificationReferenceId}/modify` | Yes | Lets the candidate enter details for a qualification, including subject, level, grade and additional information. |
| `ApplyApprenticeship.AddQualificationSelectType` | `apply/{applicationId}/qualifications/add/select-type` | Yes | Lets the candidate select the type of their most recent qualification to add. |
| `ApplyApprenticeship.AddTrainingCourse` | `apply/{applicationId}/trainingcourses/add` | Yes | Lets the applicant add a new training course to their application. |
| `ApplyApprenticeship.AddVolunteeringAndWorkExperience` | `apply/{applicationId}/volunteering-and-work-experience/add` | Yes | Allows the applicant to add details of their volunteering or work experience. |
| `ApplyApprenticeship.ApplicationSubmitted` | `applications/{applicationId}/application-submitted` | Yes | Tells the user their apprenticeship application was submitted and asks if they want to answer equality questions. |
| `ApplyApprenticeship.DeleteJob` | `apply/{applicationId}/jobs/{jobId}/delete` | Yes | Lets the applicant confirm the deletion of a job from their work history. |
| `ApplyApprenticeship.DeleteQualifications` | `apply/{applicationId}/qualifications/delete/{qualificationReferenceId}` | Yes | Lets the candidate confirm deleting a qualification from their application. |
| `ApplyApprenticeship.DeleteTrainingCourse` | `apply/{applicationId}/trainingcourses/{trainingCourseId}/delete` | Yes | Allows the applicant to delete a previously added training course from their application. |
| `ApplyApprenticeship.DeleteVolunteeringOrWorkExperience` | `apply/{applicationId}/volunteering-and-work-experience/{volunteeringWorkExperienceId}/delete` | Yes | Allows the applicant to delete a volunteering or work experience entry from their application. |
| `ApplyApprenticeship.DisabilityConfident` | `apply/{applicationId}/disability-confident` | Yes | Lets the user choose whether to apply under the Disability Confident scheme. |
| `ApplyApprenticeship.DisabilityConfidentConfirmation` | `apply/{applicationId}/disability-confident/confirm` | Yes | Shows a summary and confirmation for the Disability Confident section of the application. |
| `ApplyApprenticeship.EditJob` | `apply/{applicationId}/jobs/{jobId}` | Yes | Lets the applicant edit the details of a job in their work history. |
| `ApplyApprenticeship.EditTrainingCourse` | `apply/{applicationId}/trainingcourses/{trainingCourseId}` | Yes | Lets the applicant edit the details of a previously added training course. |
| `ApplyApprenticeship.EditVolunteeringAndWorkExperience` | `apply/{applicationId}/volunteering-and-work-experience/{volunteeringWorkExperienceId}` | Yes | Allows the applicant to edit details of a volunteering or work experience entry. |
| `ApplyApprenticeship.EmploymentLocationsSummary` | `apply/{applicationId:guid}/employmentLocations/summary` | Yes | Shows a summary of the selected employment locations and asks if the section is complete. |
| `ApplyApprenticeship.EqualityQuestions.EditEqualityQuestions` | `equality-questions/edit` | Yes | Starts editing equality questions for the applicant. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicGroup` | `equality-questions/ethnic-group` | Yes | Lets the applicant select their ethnic group. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupAsian` | `equality-questions/ethnic-group/asian` | Yes | Lets the applicant specify their Asian or Asian British ethnic subgroup, or describe their background. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupBlack` | `equality-questions/ethnic-group/black` | Yes | Lets the user select their Black, African, Caribbean or Black British ethnic sub-group and optionally describe their background. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupMixed` | `equality-questions/ethnic-group/mixed` | Yes | Lets the user select their mixed or multiple ethnic groups sub-group and optionally describe their background. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupOther` | `equality-questions/ethnic-group/other` | Yes | Lets the user choose another ethnic sub-group and optionally describe their background. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupWhite` | `equality-questions/ethnic-group/white` | Yes | Lets the user select their White ethnic sub-group and optionally describe their background. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowGender` | `equality-questions/gender` | Yes | Lets the user provide their sex and indicate if their gender identity matches their sex assigned at birth. |
| `ApplyApprenticeship.EqualityQuestions.EqualityFlowSummary` | `equality-questions/summary` | Yes | Shows a summary of the answers given in the equality questions flow. |
| `ApplyApprenticeship.InterviewAdjustments` | `apply/{applicationId}/interview-adjustments` | Yes | Lets the candidate request support or adjustments needed for an interview and provide details. |
| `ApplyApprenticeship.InterviewAdjustmentsSummary` | `apply/{applicationId}/interview-adjustments/summary` | Yes | Lets the candidate confirm if they have completed the interview adjustments section and review their interview support request. |
| `ApplyApprenticeship.Jobs` | `apply/{applicationId}/jobs` | Yes | Lets the applicant manage their work history section, including adding jobs and marking the section as complete. |
| `ApplyApprenticeship.Preview` | `applications/{applicationId}/preview` | Yes | Lets the applicant review their application and give consent before submitting. |
| `ApplyApprenticeship.Qualifications` | `apply/{applicationId}/qualifications` | Yes | Lets the candidate provide information about their qualifications, confirm completion, or add new qualifications. |
| `ApplyApprenticeship.SkillsAndStrengths` | `apply/{applicationId}/skillsandstrengths/` | Yes | Lets the applicant provide information about their skills and strengths, and mark the section as complete. |
| `ApplyApprenticeship.TrainingCourses` | `apply/{applicationId}/training-courses/` | Yes | Allows the applicant to view, add, edit, or mark training courses as complete for their application. |
| `ApplyApprenticeship.VolunteeringAndWorkExperience` | `apply/{applicationId}/volunteering-and-work-experience` | Yes | Asks the applicant if they want to add any volunteering or work experience. |
| `ApplyApprenticeship.VolunteeringAndWorkExperienceSummary` | `apply/{applicationId}/volunteering-and-work-experience/summary` | Yes | Shows a summary of the applicant’s volunteering or work experience entries. |
| `ApplyApprenticeship.WhatInterestsYou` | `apply/{applicationId}/what-interests-you` | Yes | Lets the applicant describe their interest in this apprenticeship and mark the section as complete. |
| `BrowseByInterests` | `browse-by-interests` | Unknown | Lets the user select job categories to browse apprenticeship vacancies by interests. |
| `ConfirmAccountDelete` | `confirm-account-deletion` | Yes | Lets the user confirm their account deletion. |
| `ConfirmAccountDetails` | `create-account/check-answers` | Yes | Lets the user review and confirm their account details before creating their account. |
| `ConfirmDeleteSavedSearch` | `saved-searches/{savedSearchId}/delete` | Yes | Lets the user confirm deletion of a saved search. |
| `Cookies` | `Cookies` | No | Lets the user select their cookie consent preferences. |
| `CreateAccount` | `create-account` | Yes | Starts the account creation process for the user. |
| `DateOfBirth` | `date-of-birth` | Yes | Lets the user enter or update their date of birth. |
| `DeleteSavedSearch` | `saved-searches/{savedSearchId}/delete` | Yes | Deletes a saved search after user confirmation. |
| `DeleteSavedVacancy` | `saved-vacancies/{vacancyReference}/delete` | Yes | Deletes a saved vacancy for the user. |
| `DeleteSavedVacancyFromDetailsPage` | `vacancy/delete/{vacancyId}` | Yes | Deletes a saved vacancy and returns the user to the vacancy details page. |
| `DeleteSavedVacancyFromSearchResultsPage` | `search-results/delete/{vacancyId}` | Yes | Lets the user remove a saved vacancy from their search results. |
| `Email` | `email` | Yes | Shows the user's email address. |
| `EnterAddressManually` | `enter-address` | Yes | Lets the user manually enter their address details. |
| `FinishAccountSetup` | `finish-account-setup` | Yes | Confirms the completion of account setup. |
| `GetHelp` | `get-help` | No | Provides help and support information. |
| `GetSavedSearchesUnsubscribe` | `saved-searches/unsubscribe` | Unknown | Lets the user start unsubscribing from a saved search. |
| `Location` | `location` | Unknown | Lets the user select a location or specify if they want to search nationally. |
| `Locations.LocationsBySearch` | — | Unknown | Returns location search results as JSON. |
| `MapSearchResults` | `map-search-results` | Unknown | Shows apprenticeship search results on a map. |
| `NotificationPreferences` | `notification-preferences` | Yes | Lets the user specify whether they want reminders about unfinished applications. |
| `PhoneNumber` | `phone-number` | Yes | Lets the user enter their telephone number. |
| `PostSavedSearchesUnsubscribe` | `saved-searches/unsubscribe` | Unknown | Processes the request to unsubscribe from a saved search. |
| `PostcodeAddress` | `postcode-address` | Yes | Lets the user enter their UK postcode to find their address. |
| `SaveSearch` | `apprenticeships/save-search` | Yes | Lets the user save their current apprenticeship search. |
| `SaveVacancyFromDetailsPage` | `vacancy/save/{vacancyId}` | Yes | Saves a vacancy to the user's profile and returns the user to the vacancy details page. |
| `SaveVacancyFromSearchResultsPage` | `search-results/save/{vacancyId}` | Yes | Lets the user save a vacancy from the search results page. |
| `SavedSearches` | `saved-searches` | Yes | Shows a list of the user's saved searches. |
| `SavedVacancies` | `saved-vacancies` | Yes | Lists the user's saved vacancies and allows sorting. |
| `SearchResults` | `apprenticeships` | Unknown | Displays apprenticeship search results, allowing users to filter and sort vacancies. |
| `SelectAddress` | `select-address` | Yes | Lets the user select their address from a list of addresses found for the provided postcode. |
| `ServiceStartDefault` | — | Unknown | Allows the user to start searching for apprenticeships by entering search terms. |
| `Settings` | `settings` | Yes | Provides account settings for the user. |
| `SignIn` | `signin` | Yes | Lets the user sign in to their account. |
| `SignOut` | `signout` | Unknown | Lets the user sign out of their account. |
| `TermsAndConditions` | `terms-and-conditions` | No | Displays the service's terms and conditions. |
| `UnsubscribeSavedSearchComplete` | `saved-searches/unsubscribe-complete` | Unknown | Shows confirmation that the saved search unsubscribe is complete. |
| `UserName` | `user-name` | Yes | Lets the user enter their first and last name. |
| `Vacancies` | `apprenticeship/{vacancyReference}` | Unknown | Shows detailed information about an apprenticeship vacancy and allows the user to apply, save, or delete the vacancy. |

## Form fields

Field definitions only: no values a user enters are recorded.

### `AccountDelete`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `Email` | text | Your email address | — | — | — |

### `Applications.WithdrawApplication`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `WithdrawApplication` | radios | Do you want to withdraw this application? | — | — | Yes, No |

### `ApplyApprenticeship.AddAdditionalQuestion`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `AdditionalQuestionAnswer` | textarea | — | — | required; at most 300 words; must use permitted free text characters | — |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required | Yes, I’ve completed this section, No, I’ll come back to it later (saves your answer) |

### `ApplyApprenticeship.AddEmploymentLocations`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SelectedAddressIds` | checkboxes | Where do you want to apply for? | — | required; at least one location must be selected | — |

### `ApplyApprenticeship.AddJob`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `JobTitle` | text | Job title | — | required; must use valid free text characters | — |
| `EmployerName` | text | Company | — | required; must use valid free text characters | — |
| `JobDescription` | textarea | Responsibilities | — | required; at most 100 words; must use valid free text characters | — |
| `IsCurrentRole` | radios | Is this your current job? | — | required | Yes, No |

### `ApplyApprenticeship.AddQualification`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `subjects[0][name]` | select | — | — | required unless IsDeleted is true; must be valid free text characters; additional requirements if qualification type is 'Other' | — |
| `subjects[0][level]` | select | — | — | required when CanShowLevel is true and not 'select'; must be valid free text characters | Select a level |
| `subjects[0][AdditionalInformation]` | text | — | — | required when ShouldDisplayAdditionalInformationField is true; at most 500 characters; must be valid free text characters | — |
| `subjects[0][grade]` | text | — | — | required unless IsDeleted is true and for certain qualification types; must be valid free text characters | — |
| `subjects[0][IsPredicted]` | checkboxes | — | — | — | Predicted grade |

### `ApplyApprenticeship.AddQualificationSelectType`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `QualificationReferenceId` | radios | — | — | required; must not be empty | — |

### `ApplyApprenticeship.AddTrainingCourse`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `CourseName` | text | Course name | — | required; must contain valid free text characters | — |
| `YearAchieved` | text | Year | — | required; must be a 4-digit year; must be a real year; must not be in the future | — |

### `ApplyApprenticeship.AddVolunteeringAndWorkExperience`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `CompanyName` | text | Company or organisation | — | required; must contain only valid free text characters | — |
| `Description` | textarea | What you did | — | required; at most 100 words; must contain only valid free text characters | — |
| `IsCurrentRole` | radios | Are you still doing this volunteering or work experience? | — | required | Yes, No |

### `ApplyApprenticeship.ApplicationSubmitted`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `AnswerEqualityQuestions` | radios | Do you want to answer the equality questions? | — | required (must select an option) | Yes, answer the equality questions (4 questions), No, don't answer the equality questions |

### `ApplyApprenticeship.DisabilityConfident`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `ApplyUnderDisabilityConfidentScheme` | radios | Do you want to apply under the Disability Confident scheme? | — | required | Yes, No |

### `ApplyApprenticeship.DisabilityConfidentConfirmation`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required | Yes, I've completed this section, No, I'll come back to it later |

### `ApplyApprenticeship.EditJob`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `JobTitle` | text | Job title | — | required; must use valid free text characters | — |
| `EmployerName` | text | Company | — | required; must use valid free text characters | — |
| `JobDescription` | textarea | Responsibilities | — | required; at most 100 words; must use valid free text characters | — |
| `IsCurrentRole` | radios | Is this your current job? | — | required | Yes, No |

### `ApplyApprenticeship.EditTrainingCourse`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `CourseName` | text | Course name | — | required; must contain valid free text characters | — |
| `YearAchieved` | text | Year | — | required; must be a 4-digit year; must be a real year; must not be in the future | — |

### `ApplyApprenticeship.EditVolunteeringAndWorkExperience`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `CompanyName` | text | Company or organisation | — | required; must contain only valid free text characters | — |
| `Description` | textarea | What you did | — | required; at most 100 words; must contain only valid free text characters | — |
| `IsCurrentRole` | radios | Are you still doing this volunteering or work experience? | — | required | Yes, No |

### `ApplyApprenticeship.EmploymentLocationsSummary`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required; must indicate if section is completed | Yes, I've completed this section, No, I'll come back to it later |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicGroup`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `EthnicGroup` | radios | Select your ethnic group | — | required; must select an ethnic group or 'Prefer not to say' | White, Mixed or multiple ethnic groups, Asian or Asian British, Black, African, Caribbean or Black British, Other ethnic group, Prefer not to say |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupAsian`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `EthnicSubGroup` | radios | Which of the following best describes your Asian or Asian British background? | — | required; must select a subgroup or 'Prefer not to say' | Indian, Pakistani, Bangladeshi, Chinese, Any other Asian background, Prefer not to say |
| `OtherEthnicSubGroupAnswer` | text | How would you describe your background? (optional) | — | must use valid free text characters | — |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupBlack`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `EthnicSubGroup` | radios | Which of the following best describes your Black, African, Caribbean or Black British background? | — | required (must select an option or 'Prefer not to say') | African, Caribbean, Any other Black, African or Caribbean background, Prefer not to say |
| `OtherEthnicSubGroupAnswer` | text | How would you describe your background? (optional) | — | must use valid free text characters | — |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupMixed`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `EthnicSubGroup` | radios | Which of the following best describes your mixed or multiple ethnic groups background? | — | required (must select an option or 'Prefer not to say') | White and Black Caribbean, White and Black African, White and Asian, Any other mixed or multiple ethnic background, Prefer not to say |
| `OtherEthnicSubGroupAnswer` | text | How would you describe your background? (optional) | — | must use valid free text characters | — |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupOther`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `EthnicSubGroup` | radios | Which of the following best describes your background? | — | required (must select an option or 'Prefer not to say') | Arab, Any other ethnic group, Prefer not to say |
| `OtherEthnicSubGroupAnswer` | text | How would you describe your background? (optional) | — | must use valid free text characters | — |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowEthnicSubGroupWhite`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `EthnicSubGroup` | radios | Which of the following best describes your White background? | — | required (must select an option or 'Prefer not to say') | English, Welsh, Scottish, Northern Irish or British, Irish, Gypsy or Irish Traveller, Any other White background, Prefer not to say |
| `OtherEthnicSubGroupAnswer` | text | How would you describe your background? (optional) | — | must use valid free text characters | — |

### `ApplyApprenticeship.EqualityQuestions.EqualityFlowGender`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `Sex` | radios | What is your sex? | — | required (must select an option or 'Prefer not to say') | Female, Male, Prefer not to say |
| `IsGenderIdentifySameSexAtBirth` | radios | Is the gender you identify with the same as your sex registered at birth? | — | required (must select if gender identity matches sex at birth or 'Prefer not to say') | Yes, No, Prefer not to say |

### `ApplyApprenticeship.InterviewAdjustments`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `DoYouWantInterviewAdjustments` | radios | Do you want to request support at an interview? | — | required | Yes, No, I don't need support or I'll discuss it if I get an interview |
| `InterviewAdjustmentsDescription` | textarea | Interview support request | — | required when DoYouWantInterviewAdjustments is true; must be valid free text characters; at most 500 words | — |

### `ApplyApprenticeship.InterviewAdjustmentsSummary`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required | Yes, I've completed this section, No, I'll come back to it later |

### `ApplyApprenticeship.Jobs`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required when there is job history | Yes, I’ve completed this section, No, I’ll come back to it later |
| `DoYouWantToAddAnyJobs` | radios | Do you want to add any jobs? | — | required when there is no job history | Yes, No |

### `ApplyApprenticeship.Preview`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsConsentProvided` | checkboxes | Submit your application | — | — | I understand that I won't be able to make any changes after I submit my application |

### `ApplyApprenticeship.Qualifications`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required when ShowQualifications is true | Yes, I’ve completed this section, No, I’ll come back to it later |
| `DoYouWantToAddAnyQualifications` | radios | Do you want to add any qualifications? | — | required when ShowQualifications is false | Yes, No |

### `ApplyApprenticeship.SkillsAndStrengths`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SkillsAndStrengths` | textarea | Your skills and strengths | — | required when 'IsSectionComplete' is true; must be at most 300 words; must contain valid free text characters | — |
| `IsSectionComplete` | radios | Have you completed this section? | — | required when not autosave; must be selected | Yes, I've completed this section, No, I'll come back to it later (saves your answer) |

### `ApplyApprenticeship.TrainingCourses`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionComplete` | radios | Have you completed this section? | — | required when training courses exist; must be selected | Yes, I've completed this section, No, I'll come back to it later |
| `DoYouWantToAddAnyTrainingCourses` | radios | Do you want to add any training courses? | — | required when no training courses exist; must be selected | Yes, No |

### `ApplyApprenticeship.VolunteeringAndWorkExperience`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `DoYouWantToAddAnyVolunteeringOrWorkExperience` | radios | Do you want to add any volunteering or work experience? | — | required | Yes, No |

### `ApplyApprenticeship.VolunteeringAndWorkExperienceSummary`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required | Yes, I’ve completed this section, No, I’ll come back to it later |

### `ApplyApprenticeship.WhatInterestsYou`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `AnswerText` | textarea | Your interest in this apprenticeship | — | required when IsSectionCompleted is true; at most 300 words; must use valid free text characters | — |
| `IsSectionCompleted` | radios | Have you completed this section? | — | required unless AutoSave is true | Yes, I’ve completed this section, No, I’ll come back to it later (saves your answer) |

### `BrowseByInterests`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SelectedRouteIds` | checkboxes | — | — | required; at least one job category must be selected | — |

### `Cookies`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `ConsentFunctionalCookie` | radios | Do you want to accept functional cookies? | — | — | Yes, No |
| `ConsentAnalyticsCookie` | radios | Do you want to accept analytics cookies? | — | — | Yes, No |

### `EnterAddressManually`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `AddressLine1` | text | Address line 1 | Yes | required | — |
| `AddressLine2` | text | Address line 2 (optional) | — | — | — |
| `TownOrCity` | text | Town or city | — | — | — |
| `County` | text | County (optional) | — | — | — |
| `Postcode` | text | Postcode | Yes | required | — |

### `Location`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `NationalSearch` | radios | Question 2 of 2 Where would you like to search? | — | required; must select a search location | Enter a city or postcode, Search across all of England |
| `SearchTerm` | text | City or postcode | — | — | — |
| `Distance` | select | Within | — | — | 2 miles, 5 miles, 10 miles, 15 miles, 20 miles, 30 miles, 40 miles |

### `NotificationPreferences`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `UnfinishedApplicationReminders` | radios | Do you want to get reminders about unfinished applications? | — | required; must choose whether to receive reminders | Yes, No |

### `PhoneNumber`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `PhoneNumber` | text | Telephone number | — | required; must match valid UK phone number formats | — |

### `PostcodeAddress`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `Postcode` | text | UK postcode | — | required; at most 10 characters; must only contain alphanumeric characters and spaces; must be a full UK postcode | — |

### `SavedVacancies`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SortOrder` | select | — | — | — | — |

### `SearchResults`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SearchTerm` | text | What | — | — | — |
| `location` | text | Where | — | — | — |
| `distance` | select | — | — | — | 2 miles, 5 miles, 10 miles, 15 miles, 20 miles, 30 miles, 40 miles, across England |
| `ExcludeNational` | checkboxes | Hide companies recruiting nationally | — | — | Hide companies recruiting nationally |
| `DisabilityConfident` | checkboxes | Only show Disability Confident companies | — | — | Only show Disability Confident companies |
| `sort` | select | — | — | — | Distance, New, Closing soon, Wage, Start date |
| `QueryStringParameterName` | checkboxes | — | — | — | — |

### `SelectAddress`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `SelectedAddress` | select | Select an address from the list | — | required; must not be 'choose' | Select address |

### `ServiceStartDefault`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `WhatSearchTerm` | text | What | — | — | — |
| `WhereSearchTerm` | text | Where | — | — | — |

### `UserName`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `FirstName` | text | First name | — | required; must contain only valid free text characters | — |
| `LastName` | text | Last name | — | required; must contain only valid free text characters | — |

### `Vacancies`

| Field | Type | Label | Required | Rules | Options |
| --- | --- | --- | --- | --- | --- |
| `directions-postcode` | text | Postcode | — | — | — |
| `directions-location` | select | Select location | — | — | — |
| `directions-travelMode` | select | Select a method of travelling | — | — | Car, Cycling, Walking, Public transport |

