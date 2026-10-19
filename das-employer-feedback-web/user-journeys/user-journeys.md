# User journeys: SkillsFundingAgency/das-employer-feedback-web

Generated from `main/src`: 13 pages, 0 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `Home.Index` | — | No | Serves as the landing or homepage. Redirects dependent on environment. |
| `Provider.ClearFilters` | `providers/clearfilters` | Yes | Clears any filters applied during the provider search process. |
| `Provider.ProviderConfirm` | `providers/{providerId}` | Yes | Confirms a selected provider and proceeds to the feedback process. |
| `Provider.ProviderSearch` | `providers` | Yes | Allows users to search for providers to provide feedback. |
| `Provider.SortProviders` | `providers/sort` | Yes | Enables users to sort providers based on specific criteria during the search. |
| `Questions.QuestionOne` | `question-one` | Yes | Shows the first feedback question about strengths of the provider. |
| `Questions.QuestionThree` | `question-three` | Yes | Shows the third feedback question about provider ratings. |
| `Questions.QuestionTwo` | `question-two` | Yes | Shows the second feedback question about weaknesses of the provider. |
| `Questions.StartFeedback` | `landing` | Yes | Initiates the feedback process on a provider. |
| `ReviewAnswers.FeedbackAlreadySubmitted` | `feedback-submitted` | Yes | Indicates feedback has already been submitted. |
| `ReviewAnswers.FeedbackConfirmation` | `feedback-confirmation` | Yes | Confirms successful submission of feedback. |
| `ReviewAnswers.ReviewAnswers` | `review-answers` | Yes | Lets users review their answers before submitting feedback. |
| `ReviewAnswers.ReviewAnswersConfirmed` | `review-answers` | Yes | Processes the confirmation of reviewed answers for feedback submission. |
