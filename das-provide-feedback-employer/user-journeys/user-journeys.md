# User journeys: SkillsFundingAgency/das-provide-feedback-employer

Generated from `master/src`: 18 pages, 20 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `Confirmation_Get` | `feedback-confirmation` | Yes | Displays the confirmation page to summarize feedback submission details. |
| `FeedbackAlreadySubmitted` | `/{encodedAccountId}/feedback-submitted` | Yes | Informs the user that feedback has already been submitted for their account. |
| `Landing_Get` | — | Yes | Allows the employer to initiate feedback flow via an email link. |
| `Landing_Get_New` | — | Yes | Displays the feedback initiation page after the employer account has been identified. |
| `Provider.ClearFilters` | `/{encodedAccountId}/providers/unfilter` | Yes | Resets any filters applied during provider search. |
| `Provider.ConfirmProvider` | `/{encodedAccountId}/providers/{providerId}` | Yes | Allows the user to confirm their training provider. |
| `Provider.Filter` | `/{encodedAccountId}/providers` | Yes | Applies filters to narrow down the list of providers based on user input. |
| `Provider.Index` | `/{encodedAccountId}/providers` | Yes | Displays a list of training providers for feedback submission. |
| `Provider.ProviderConfirmed` | `/{encodedAccountId}/providers/{providerId}` | Yes | Processes and redirects after confirming the training provider. |
| `Provider.SortProviders` | `/{encodedAccountId}/providers/sort` | Yes | Sorts the list of training providers based on user-selected criteria. |
| `QuestionOne_Get` | `question-one` | Yes | Displays the first feedback question related to provider strengths. |
| `QuestionOne_Post` | `question-one` | Yes | Submits the response for the provider strengths question. |
| `QuestionThree_Get` | `question-three` | Yes | Displays the third feedback question related to overall scoring. |
| `QuestionThree_Post` | `question-three` | Yes | Submits the response for the provider scoring question. |
| `QuestionTwo_Get` | `question-two` | Yes | Displays the second feedback question related to provider weaknesses. |
| `QuestionTwo_Post` | `question-two` | Yes | Allows the user to submit their responses to the second question in the survey. |
| `ReviewAnswers_Get` | `review-answers` | Yes | Displays a page for the user to review and confirm their survey answers. |
| `ReviewAnswers_Post` | `review-answers` | Yes | Handles the submission of the user's reviewed answers and redirects to the confirmation page. |
