# User journeys: SkillsFundingAgency/tl-results-and-certification

Generated from `master/src`: 370 pages, 0 transitions, 0 journeys. 🔒 means sign-in is required. Dotted arrows return to a hub.

## Pages

| Page | Route | Sign-in | Purpose |
| --- | --- | --- | --- |
| `Account.PostSignIn` | — | Yes | Redirects the user to the appropriate page after signing in based on their authentication and access rights. |
| `Account.Profile` | `account-profile` | Yes | Redirects the user to the account profile page, as configured. |
| `Account.SignOutDsi` | `sign-out` | Yes | Allows the user to sign out and redirects to a configured URL for sign-out. |
| `Account.SignoutComplete` | `signout-complete` | No | Handles the completion of the sign-out process and redirects to appropriate page or URL. |
| `AdminAssessmentSeriesDates.AdminAssessmentSeriesDateAsync` | `admin/assessment-series-date/{assessmentId}` | Yes | Displays details of an assessment series for administrators. |
| `AdminAssessmentSeriesDates.SearchAssessmentSeriesDatesApplyFiltersAsync` | `admin/search-assessment-series-dates-apply-filters` | Yes | Applies filters to refine search results for assessment series dates. |
| `AdminAssessmentSeriesDates.SearchAssessmentSeriesDatesAsync` | `admin/search-assessment-series-dates` | Yes | Allows administrators to search for assessment series dates. |
| `AdminAssessmentSeriesDates.SearchAssessmentSeriesDatesClearAsync` | `admin/search-assessment-series-dates-clear` | Yes | Clears the cached assessment series search data. |
| `AdminAssessmentSeriesDates.SearchAssessmentSeriesDatesClearFiltersAsync` | `admin/search-assessment-series-dates-clear-filters` | Yes | Clears filters applied to the search for assessment series dates. |
| `AdminAwardingOrganisation.AdminDownloadCoreResultsDataLinkAsync` | `admin/download-core-results/{awardingOrganisationUkprn}/{fileId}` | Yes | Enables administrators to download core results data for a specific awarding organisation and file. |
| `AdminAwardingOrganisation.AdminDownloadResultsRommsByAwardingOrganisationAsync` | `admin/download-results-romms-awarding-organisation/{awardingOrganisationUkprn}` | Yes | Facilitates downloading ROMM results for a specific awarding organisation. |
| `AdminAwardingOrganisation.AdminDownloadRommsDataLinkAsync` | `admin/download-romms-data/{awardingOrganisationUkprn}/{fileId}` | Yes | Allows administrators to download ROMMS data for a specific awarding organisation and file. |
| `AdminAwardingOrganisation.AdminDownloadSpecialismResultsDataLinkAsync` | `admin/download-specialism-results/{awardingOrganisationUkprn}/{fileId}` | Yes | Enables administrators to download specialism results data for a specific awarding organisation and file. |
| `AdminAwardingOrganisation.AdminSelectAwardingOrganisationAsync` | `admin/select-awarding-organisation` | Yes | Provides an interface for administrators to select an awarding organisation. |
| `AdminAwardingOrganisation.AdminSelectAwardingOrganisationClearAsync` | `admin/select-awarding-organisation-clear` | Yes | Clears cached data related to the selection of an awarding organisation. |
| `AdminChangeLog.AdminSearchChangeLogAsync` | `admin/change-log/{pageNumber:int?}` | Yes | Allows searching the admin change log by page number. |
| `AdminChangeLog.AdminSearchChangeLogClearAsync` | `admin/change-log-clear` | Yes | Clears the admin change log search criteria. |
| `AdminChangeLog.AdminSearchChangeLogClearKeyAsync` | `admin/change-log-clear-key` | Yes | Clears the search key for the admin change log search. |
| `AdminChangeLog.AdminSearchChangeLogSearchKeyAsync` | `admin/change-log-search-key` | Yes | Applies a search key to filter the admin change log. |
| `AdminChangeLog.AdminViewChangeRecordAddPathwayResultAsync` | `admin/view-change-record/7/{changeLogId}` | Yes | Views change record details for adding a pathway result. |
| `AdminChangeLog.AdminViewChangeRecordAddSpecialismResultAsync` | `admin/view-change-record/8/{changeLogId}` | Yes | Views change record details for adding a specialism result. |
| `AdminChangeLog.AdminViewChangeRecordChangePathwayResultAsync` | `admin/view-change-record/9/{changeLogId}` | Yes | Views change record details for modifying a pathway result. |
| `AdminChangeLog.AdminViewChangeRecordChangeSpecialismResultAsync` | `admin/view-change-record/10/{changeLogId}` | Yes | Views change record details for modifying a specialism result. |
| `AdminChangeLog.AdminViewChangeRecordCoreAssessmentAsync` | `admin/view-change-record/3/{changeLogId}` | Yes | Views change record details for core assessment. |
| `AdminChangeLog.AdminViewChangeRecordIPAsync` | `admin/view-change-record/2/{changeLogId}` | Yes | Views change record details for industry placement changes. |
| `AdminChangeLog.AdminViewChangeRecordOpenPathwayAppealAsync` | `admin/view-change-record/15/{changeLogId}` | Yes | Views details for opening a pathway appeal record. |
| `AdminChangeLog.AdminViewChangeRecordOpenPathwayRommAsync` | `admin/view-change-record/11/{changeLogId}` | Yes | Views details for opening a pathway review of marking moderation (ROMM) record. |
| `AdminChangeLog.AdminViewChangeRecordOpenSpecialismAppealAsync` | `admin/view-change-record/16/{changeLogId}` | Yes | Views details for opening a specialism appeal record. |
| `AdminChangeLog.AdminViewChangeRecordOpenSpecialismRommAsync` | `admin/view-change-record/12/{changeLogId}` | Yes | Views details for opening a specialism review of marking moderation (ROMM) record. |
| `AdminChangeLog.AdminViewChangeRecordPathwayAppealOutcomeAsync` | `admin/view-change-record/17/{changeLogId}` | Yes | Views details for pathway appeal outcomes. |
| `AdminChangeLog.AdminViewChangeRecordPathwayRommOutcomeAsync` | `admin/view-change-record/13/{changeLogId}` | Yes | Allows administrators to view the change record for Pathway ROMM outcomes. |
| `AdminChangeLog.AdminViewChangeRecordRemoveCoreAssessmentAsync` | `admin/view-change-record/5/{changeLogId}` | Yes | Displays the change record for removing a core assessment. |
| `AdminChangeLog.AdminViewChangeRecordRemoveSpecialismAssessmentAsync` | `admin/view-change-record/6/{changeLogId}` | Yes | Shows the change record for removing a specialism assessment. |
| `AdminChangeLog.AdminViewChangeRecordSpecialismAppealOutcomeAsync` | `admin/view-change-record/18/{changeLogId}` | Yes | Enables administrators to review the outcome of appeals for specialism assessments. |
| `AdminChangeLog.AdminViewChangeRecordSpecialismAssessmentAsync` | `admin/view-change-record/4/{changeLogId}` | Yes | Allows administrators to review the change record for specialism assessments. |
| `AdminChangeLog.AdminViewChangeRecordSpecialismRommOutcomeAsync` | `admin/view-change-record/14/{changeLogId}` | Yes | Displays the ROMM outcome for specialism assessments. |
| `AdminChangeLog.AdminViewChangeRecordStartYearAsync` | `admin/view-change-record/1/{changeLogId}` | Yes | Lets administrators review the change record for the start year. |
| `AdminDashboard.AdminAddPathwayResultAsync` | `admin/add-assessment-result-core/{registrationPathwayId}/{assessmentId}`, `admin/add-assessment-result-core` | Yes | Allows administrators to add a pathway assessment result. |
| `AdminDashboard.AdminAddPathwayResultClearAsync` | `admin/add-assessment-result-core-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears the pathway assessment result being added. |
| `AdminDashboard.AdminAddPathwayResultReviewChangesAsync` | `admin/review-changes-assessment-result-core` | Yes | Reviews the changes made to pathway assessment results before confirmation. |
| `AdminDashboard.AdminAddSpecialismResultAsync` | `admin/add-assessment-result-specialism/{registrationPathwayId}/{assessmentId}`, `admin/add-assessment-result-specialism` | Yes | Allows administrators to add a specialism assessment result. |
| `AdminDashboard.AdminAddSpecialismResultClearAsync` | `admin/add-assessment-result-specialism-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears the specialism assessment result being added. |
| `AdminDashboard.AdminAddSpecialismResultReviewChangesAsync` | `admin/review-changes-assessment-result-specialism` | Yes | Reviews the changes made to specialism assessment results prior to saving. |
| `AdminDashboard.AdminChangeIndustryPlacementAsync` | `admin/change-industry-placement/{registrationPathwayId}`, `admin/submit-change-industry-placement` | Yes | Enables administrators to change industry placement details. |
| `AdminDashboard.AdminChangePathwayResultAsync` | `admin/change-assessment-result-core/{registrationPathwayId}/{assessmentId}`, `admin/change-assessment-result-core` | Yes | Allows administrators to update pathway assessment results. |
| `AdminDashboard.AdminChangePathwayResultClearAsync` | `admin/change-assessment-result-core-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears selected pathway assessment results for a learner. |
| `AdminDashboard.AdminChangePathwayResultReviewChangesAsync` | `admin/change-assessment-result-core-review-changes` | Yes | Reviews changes made to pathway assessment results before confirmation. |
| `AdminDashboard.AdminChangeSpecialismResultAsync` | `admin/change-assessment-result-specialism/{registrationPathwayId}/{assessmentId}`, `admin/change-assessment-result-specialism` | Yes | Allows the admin to change the specialism assessment results for a learner. |
| `AdminDashboard.AdminChangeSpecialismResultClearAsync` | `admin/change-assessment-result-specialism-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears selected specialism assessment results for a learner. |
| `AdminDashboard.AdminChangeSpecialismResultReviewChangesAsync` | `admin/change-assessment-result-specialism-review-changes` | Yes | Reviews changes made to specialism assessment results before confirmation. |
| `AdminDashboard.AdminCoreComponentAssessmentEntry` | `admin/add-assessment-entry-core/{registrationPathwayId}`, `admin/submit-add-assessment-entry-core` | Yes | Adds or submits a core assessment entry for a learner. |
| `AdminDashboard.AdminCoreComponentAssessmentEntryClearAsync` | `admin/add-assessment-core-entry-clear/{registrationPathwayId}` | Yes | Clears the core assessment entry data for a learner. |
| `AdminDashboard.AdminHome` | `admin/home` | Yes | Redirects to the admin dashboard homepage. |
| `AdminDashboard.AdminIndustryPlacementSpecialConsiderationHoursAsync` | `admin/industry-placement-hours` | Yes | Allows the admin to specify special consideration hours for industry placement. |
| `AdminDashboard.AdminIndustryPlacementSpecialConsiderationReasonsAsync` | `admin/industry-placement-incomplete` | Yes | Captures reasons for incomplete industry placements. |
| `AdminDashboard.AdminLearnerRecordAsync` | `admin/learner-record/{pathwayid}` | Yes | Views the record of a learner's pathway and assessments. |
| `AdminDashboard.AdminOccupationalSpecialisAssessmentEntryClearAsync` | `admin/add-assessment-specialism-entry-clear/{registrationPathwayId}/{specialismsId}` | Yes | Clears assessment entry data for occupational specialisms. |
| `AdminDashboard.AdminOccupationalSpecialismAssessmentEntry` | `admin/add-assessment-entry-specialism/{registrationPathwayId}/{specialismsId}`, `admin/submit-add-assessment-entry-specialism` | Yes | Adds or submits assessment entry data for occupational specialisms. |
| `AdminDashboard.AdminRequestReplacementDocumentAsync` | `admin/request-replacement-document/{registrationPathwayId}`, `admin/request-replacement-document` | Yes | Requests a replacement document for a learner's registration pathway. |
| `AdminDashboard.AdminReviewChangesCoreAssessmentEntry` | `admin/review-changes-assesment-entry-core/{registrationPathwayId}`, `admin/submit-review-changes-assessment-entry-core` | Yes | Reviews changes made to core assessment entries before confirmation. |
| `AdminDashboard.AdminReviewChangesIndustryPlacementAsync` | `admin/review-changes-industry-placement/{pathwayId}`, `admin/submit-review-changes-industry-placement` | Yes | Allows the administrator to review changes made to an industry placement for a learner. |
| `AdminDashboard.AdminReviewChangesSpecialismAssessmentEntry` | `admin/review-changes-assesment-entry-specialism/{registrationPathwayId}`, `admin/submit-review-changes-assessment-entry-specialism` | Yes | Allows the administrator to review changes made to a specialism assessment entry for a learner. |
| `AdminDashboard.AdminReviewRemoveCoreAssessmentEntryAsync` | `admin/review-remove-assessment-entry-core` | Yes | Allows the administrator to review removal of a core assessment entry for a learner. |
| `AdminDashboard.AdminReviewRemoveSpecialismAssessmentEntryAsync` | `admin/review-remove-assessment-entry-specialism/{registrationPathwayId}`, `admin/review-remove-assessment-entry-specialism` | Yes | Allows the administrator to review removal of a specialism assessment entry for a learner. |
| `AdminDashboard.AdminSearchLearnerClearFiltersAsync` | `admin/search-learner-records-clear-filters` | Yes | Clears all search filters applied while searching learner records. |
| `AdminDashboard.AdminSearchLearnerClearKeyAsync` | `admin/search-learner-records-clear-key` | Yes | Clears the search key applied while searching learner records. |
| `AdminDashboard.AdminSearchLearnerRecordsApplyFiltersAsync` | `admin/search-learner-records-filters` | Yes | Applies filters to search for learner records. |
| `AdminDashboard.AdminSearchLearnersAsync` | `admin/search-learner-records/{pageNumber:int?}` | Yes | Allows the administrator to search for learner records, possibly paginated. |
| `AdminDashboard.AdminSearchLearnersRecordsApplySearchKeyAsync` | `admin/search-learner-records-search-key` | Yes | Applies a specific search key to find learner records. |
| `AdminDashboard.AdminSearchLearnersRecordsClearAsync` | `admin/search-learner-records-clear` | Yes | Clears all applied filters and search keys while searching learner records. |
| `AdminDashboard.ChangeIndustryPlacementClearAsync` | `admin/change-industry-placement-clear/{registrationPathwayId}` | Yes | Clears the cached data related to a change in industry placement for a learner. |
| `AdminDashboard.ChangeStartYearAsync` | `admin/change-start-year/{registrationPathwayId}`, `admin/submit-change-start-year` | Yes | Allows the administrator to change the start year for a learner's registration. |
| `AdminDashboard.ChangeStartYearClearAsync` | `admin/change-start-year-clear/{registrationPathwayId}` | Yes | Clears the cached data related to changing the start year for a learner. |
| `AdminDashboard.RemoveAssessmentEntryCoreAsync` | `admin/remove-assessment-entry-core/{registrationPathwayId}/{assessmentId}`, `admin/remove-assessment-entry-core` | Yes | Allows the administrator to initiate the removal of a core assessment entry for a learner. |
| `AdminDashboard.RemoveAssessmentEntryCoreClearAsync` | `admin/remove-assessment-entry-core-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears the cached data related to removing a core assessment entry for a learner. |
| `AdminDashboard.RemoveAssessmentEntrySpecialismAsync` | `admin/remove-assessment-entry-specialism/{registrationPathwayId}/{assessmentId}`, `admin/remove-assessment-entry-specialism` | Yes | Allows the admin to remove a learner's specialism assessment entry. |
| `AdminDashboard.RemoveAssessmentEntrySpecialismClearAsync` | `admin/remove-assessment-entry-specialism-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears the cached data related to removing a learner's specialism assessment entry and redirects to the relevant route. |
| `AdminDashboard.ReviewChangeStartYearAsync` | `admin/review-changes-start-year/{pathwayId}`, `admin/submit-review-changes-start-year` | Yes | Allows the admin to review and confirm changes to a learner's academic start year. |
| `AdminDownloadLearnerResults.AdminDownloadLearnerResultsByProviderAsync` | `admin/download-learner-results-provider/{providerId}` | Yes | Provides the functionality for downloading learner results grouped by a specific provider. |
| `AdminDownloadLearnerResults.AdminDownloadLearnerResultsCsvAsync` | `admin/download-learner-results-file-csv/{ukprn}` | Yes | Provides the functionality for downloading learner results as a CSV file for a specific UKPRN. |
| `AdminDownloadLearnerResults.AdminDownloadLearnerResultsFindProviderAsync` | `admin/download-learner-results-find-provider` | Yes | Allows the admin to search for providers to find learner results. |
| `AdminDownloadLearnerResults.AdminDownloadLearnerResultsFindProviderClearAsync` | `admin/download-learner-results-find-provider-clear` | Yes | Clears cached provider search data and redirects to the provider search page. |
| `AdminDownloadLearnerResults.AdminDownloadLearnerResultsPdfAsync` | `admin/download-learner-results-file-pdf/{ukprn}` | Yes | Provides the functionality for downloading learner results as a PDF file for a specific UKPRN. |
| `AdminNotification.AdminAddNotificationAsync` | `admin/add-notification` | Yes | Allows administrators to add a new notification. |
| `AdminNotification.AdminDeleteNotificationAsync` | `admin/delete-notification/{notificationId}`, `admin/delete-notification` | Yes | Allows administrators to delete an existing notification. |
| `AdminNotification.AdminEditNotificationAsync` | `admin/edit-notification` | Yes | Allows administrators to edit an existing notification. |
| `AdminNotification.AdminFindNotificationApplyFiltersAsync` | `admin/find-notification-apply-filters` | Yes | Allows administrators to apply filters to search for notifications. |
| `AdminNotification.AdminFindNotificationAsync` | `admin/find-notification/{pageNumber:int?}` | Yes | Allows administrators to view and search for notifications across pages. |
| `AdminNotification.AdminFindNotificationClearAsync` | `admin/find-notification-clear` | Yes | Clears all cached search criteria for finding notifications. |
| `AdminNotification.AdminFindNotificationClearFiltersAsync` | `admin/find-notification-clear-filters` | Yes | Clears all filters applied while searching for notifications. |
| `AdminNotification.AdminNotificationDetailsAsync` | `admin/notification-details/{notificationId}` | Yes | Displays the details of a specific notification. |
| `AdminPostResults.AdminAddAppealOutcomeChangeGradeCoreAsync` | `admin/add-appeal-outcome-change-grade-core/{registrationPathwayId}/{assessmentId}`, `admin/add-appeal-outcome-change-grade-core` | Yes | Allows administrators to add appeal outcomes and change grades for core assessments. |
| `AdminPostResults.AdminAddAppealOutcomeChangeGradeCoreClearAsync` | `admin/add-appeal-outcome-change-grade-core-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears data related to appeal outcomes and grade changes for core assessments. |
| `AdminPostResults.AdminAddAppealOutcomeChangeGradeSpecialismAsync` | `admin/add-appeal-outcome-change-grade-specialism/{registrationPathwayId}/{assessmentId}`, `admin/add-appeal-outcome-change-grade-specialism` | Yes | Allows administrators to add appeal outcomes and change grades for specialism assessments. |
| `AdminPostResults.AdminAddAppealOutcomeChangeGradeSpecialismClearAsync` | `admin/add-appeal-outcome-change-grade-specialism-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears data related to appeal outcomes and grade changes for specialism assessments. |
| `AdminPostResults.AdminAddCoreAppealOutcomeAsync` | `admin/add-appeal-outcome-core` | Yes | Allows administrators to add appeal outcomes for core assessments. |
| `AdminPostResults.AdminAddCoreAppealOutcomeClearAsync` | `admin/add-appeal-outcome-core-clear` | Yes | Clears the cached data related to appeal outcomes for core assessments. |
| `AdminPostResults.AdminAddCoreRommOutcomeAsync` | `admin/add-romm-outcome-core` | Yes | Allows administrators to add 'ROMM' (Review of Marking and Moderation) outcomes for core assessments. |
| `AdminPostResults.AdminAddCoreRommOutcomeClearAsync` | `admin/add-romm-outcome-core-clear` | Yes | Clears data related to opening ROMM outcomes for pathway core assessments. |
| `AdminPostResults.AdminAddRommOutcomeChangeGradeCoreAsync` | `admin/add-romm-outcome-change-grade-core/{registrationPathwayId}/{assessmentId}`, `admin/add-romm-outcome-change-grade-core` | Yes | Lets the user change the grade for a ROMM outcome in pathway core assessments. |
| `AdminPostResults.AdminAddRommOutcomeChangeGradeCoreClearAsync` | `admin/add-romm-outcome-change-grade-core-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears data related to changing the grade for a ROMM outcome in pathway core assessments. |
| `AdminPostResults.AdminAddRommOutcomeChangeGradeSpecialismAsync` | `admin/add-romm-outcome-change-grade-specialism/{registrationPathwayId}/{assessmentId}`, `admin/add-romm-outcome-change-grade-specialism` | Yes | Lets the user change the grade for a ROMM outcome in specialism assessments. |
| `AdminPostResults.AdminAddRommOutcomeChangeGradeSpecialismClearAsync` | `admin/add-romm-outcome-change-grade-specialism-clear/{registrationPathwayId}/{assessmentId}` | Yes | Clears data related to changing the grade for a ROMM outcome in specialism assessments. |
| `AdminPostResults.AdminAddSpecialismAppealOutcomeAsync` | `admin/add-appeal-outcome-specialism` | Yes | Lets the user add an appeal outcome for specialism assessments. |
| `AdminPostResults.AdminAddSpecialismAppealOutcomeClearAsync` | `admin/add-appeal-outcome-specialism-clear` | Yes | Clears data related to adding an appeal outcome for specialism assessments. |
| `AdminPostResults.AdminAddSpecialismRommOutcomeAsync` | `admin/add-romm-outcome-specialism` | Yes | Lets the user add a ROMM outcome for specialism assessments. |
| `AdminPostResults.AdminAddSpecialismRommOutcomeClearAsync` | `admin/add-romm-outcome-specialism-clear` | Yes | Clears data related to adding a ROMM outcome for specialism assessments. |
| `AdminPostResults.AdminOpenPathwayAppealAsync` | `admin/open-appeal-core` | Yes | Lets the user open an appeal for pathway core assessments. |
| `AdminPostResults.AdminOpenPathwayAppealClearAsync` | `admin/open-appeal-core-clear` | Yes | Clears data related to opening an appeal for pathway core assessments. |
| `AdminPostResults.AdminOpenPathwayRommAsync` | `admin/open-romm-core` | Yes | Lets the user open a ROMM for pathway core assessments. |
| `AdminPostResults.AdminOpenPathwayRommClearAsync` | `admin/open-romm-core-clear` | Yes | Clears data related to opening a ROMM for pathway core assessments. |
| `AdminPostResults.AdminOpenPathwayRommReviewChangesAsync` | `admin/review-changes-romm-core` | Yes | Allows the user to review changes made to ROMM outcomes for pathway core assessments. |
| `AdminPostResults.AdminOpenSpecialismAppealAsync` | `admin/open-appeal-specialism` | Yes | Lets the user open an appeal for specialism assessments. |
| `AdminPostResults.AdminOpenSpecialismAppealClearAsync` | `admin/open-appeal-specialism-clear` | Yes | Clears the appeal process for a specialism. |
| `AdminPostResults.AdminOpenSpecialismRommAsync` | `admin/open-romm-specialism` | Yes | Opens the ROMM process for a specialism. |
| `AdminPostResults.AdminOpenSpecialismRommClearAsync` | `admin/open-romm-specialism-clear` | Yes | Clears the ROMM process for a specialism. |
| `AdminPostResults.AdminOpenSpecialismRommReviewChangesAsync` | `admin/review-changes-romm-specialism` | Yes | Allows an admin to review changes in the ROMM process for a specialism. |
| `AdminPostResults.AdminReviewChangesAppealOutcomeCoreAsync` | `admin/add-appeal-outcome-change-grade-review-changes-core` | Yes | Reviews changes in the appeal outcome for a core subject. |
| `AdminPostResults.AdminReviewChangesAppealOutcomeSpecialismAsync` | `admin/add-appeal-outcome-change-grade-review-changes-specialism`, `admin/add-Appeal-outcome-change-grade-review-changes-specialism` | Yes | Reviews changes in the appeal outcome for a specialism. |
| `AdminPostResults.AdminReviewChangesRommOutcomeCoreAsync` | `admin/add-romm-outcome-change-grade-review-changes-core` | Yes | Reviews changes in the ROMM outcome for a core assessment. |
| `AdminPostResults.AdminReviewChangesRommOutcomeSpecialismAsync` | `admin/add-romm-outcome-change-grade-review-changes-specialism` | Yes | Reviews changes in the ROMM outcome for a specialism assessment. |
| `AdminPostResults.AdminReviewCoreAppealChangesAsync` | `admin/review-changes-appeal-core/{registrationPathwayId}/{assessmentId}` | Yes | Allows administrators to review appeal changes for a core subject. |
| `AdminPostResults.AdminReviewSpecialismAppealChangesAsync` | `admin/review-changes-appeal-specialism/{registrationPathwayId}/{assessmentId}` | Yes | Allows administrators to review appeal changes for a specialism subject. |
| `AdminProvider.AdminAddProviderAsync` | `admin/add-provider` | Yes | Provides the functionality to add a new provider. |
| `AdminProvider.AdminEditProviderAsync` | `admin/edit-provider/{providerId}`, `admin/edit-provider` | Yes | Allows an administrator to edit an existing provider's details. |
| `AdminProvider.AdminFindProviderAsync` | `admin/find-provider` | Yes | Searches for a provider using given criteria. |
| `AdminProvider.AdminFindProviderClearAsync` | `admin/find-provider-clear` | Yes | Clears the search criteria for finding a provider. |
| `AdminProvider.AdminProviderDetailsAsync` | `admin/provider-details/{providerId}` | Yes | Displays details of a specific provider. |
| `Assessment.AddCoreAssessmentEntryAsync` | `assessment-entry-add-core/{profileId}` | Yes | Allows users to add core assessment entries for a learner profile. |
| `Assessment.AddSpecialismAssessmentEntryAsync` | `assessment-entry-add-specialisms/{profileId}/{specialismsId}` | Yes | Enables users to add specialism assessment entries for specific learner profiles and specialisms. |
| `Assessment.AssessmentDetailsAsync` | `assessment-entry-learner-details/{profileId}` | Yes | Displays details of assessment entries for a learner profile. |
| `Assessment.AssessmentWithdrawnDetailsAsync` | `assessment-entries-learner-withdrawn/{profileId}` | Yes | Shows details of withdrawn assessment entries for a learner profile. |
| `Assessment.AssessmentsDownloadDataAsync` | `assessments-download-data` | Yes | Provides a view where users can download assessment data. |
| `Assessment.AssessmentsDownloadDataLinkAsync` | `download-assessments-data/{id}/{componentType}` | Yes | Generates a downloadable file for assessments data based on specific ID and component type. |
| `Assessment.AssessmentsGeneratingDownload` | `assessments-generating-download` | Yes | Informs users about the generation process of downloadable assessment data. |
| `Assessment.AssessmentsNoRecordsFound` | `assessments-no-records-found` | Yes | Notifies users when no assessment records are found during a download request. |
| `Assessment.Index` | `assessment-entries` | Yes | Serves as the assessment dashboard for various functionalities related to assessment entries. |
| `Assessment.ProblemWithAssessmentsUpload` | `assessment-entries-file-upload-service-problem` | Yes | Shows a service problem page related to assessment file uploads. |
| `Assessment.RemoveCoreAssessmentEntryAsync` | `assessment-entry-remove-core/{assessmentId}` | Yes | Allows users to remove core assessment entries for specific assessments. |
| `Assessment.RemoveSpecialismAssessmentEntriesAsync` | `assessment-entry-remove-specialisms/{profileId}/{specialismAssessmentIds}` | Yes | Enables users to remove specialism assessment entries based on profile and assessment IDs. |
| `Assessment.SubmitAssessmentsGeneratingDownloadAsync` | `assessments-generating-download` | Yes | Submits requests for generating assessment data exports. |
| `Assessment.UploadAssessmentsFile` | `upload-assessment-entries-file/{requestErrorTypeId:int?}` | Yes | Allows users to upload a file containing assessments data. |
| `Assessment.UploadAssessmentsFileAsync` | `upload-assessment-entries-file` | Yes | Processes uploaded assessment entries files asynchronously. |
| `Assessment.UploadSuccessful` | `assessment-entries-upload-confirmation` | Yes | Shows a confirmation page after successfully uploading assessment entries. |
| `Assessment.UploadUnsuccessful` | `assessment-entries-upload-unsuccessful` | Yes | Displays an error page when assessment entries upload fails. |
| `Dashboard.Index` | `home` | Yes | Provides the main dashboard view for the user's home page. |
| `Document.DownloadAssessmentEntriesDataFormatAndRulesGuideAsync` | `tlevels-assessment-entries-data-format-and-rules` | No | Allows users to download a guide that explains the assessment entries data format and rules. |
| `Document.DownloadAssessmentEntriesTemplateAsync` | `tlevels-assessment-entries-template` | No | Provides a template for bulk uploading assessment entries. |
| `Document.DownloadRegistrationDataFormatAndRulesGuideAsync` | `tlevels-registration-data-format-and-rules` | No | Allows users to download a guide that explains registration data format and rules. |
| `Document.DownloadRegistrationDataTemplateAsync` | `tlevels-registration-data-template` | No | Provides a template for bulk uploading registration data. |
| `Document.DownloadResultsDataFormatAndRulesGuideAsync` | `tlevels-results-data-format-and-rules` | No | Lets users download a guide explaining results data format and rules. |
| `Document.DownloadResultsTemplateAsync` | `tlevels-results-template` | No | Provides a template for bulk uploading results data. |
| `Document.DownloadRommDataFormatAndRulesGuideAsync` | `tlevels-romm-data-format-and-rules` | No | Lets users download a guide explaining ROMM data format and rules. |
| `Document.DownloadRommDataTemplateAsync` | `tlevels-romm-data-template` | No | Provides a template for bulk uploading ROMM data. |
| `Document.DownloadWithdrawalDataFormatAndRulesGuideAsync` | `tlevels-withdrawals-data-format-and-rules` | No | Allows users to download a guide explaining data format and rules for withdrawals. |
| `Document.DownloadWithdrawalnDataTemplateAsync` | `tlevels-withdrawal-data-template` | No | Provides a template for bulk uploading withdrawal data. |
| `Document.TlevelDataFormatAndRulesGuide` | `tlevel-data-format-and-rules-guides` | No | Provides access to all T-level data format and rules guides. |
| `DownloadOverallResults.DownloadLearnerOverallResultSlipsFileAsync` | `download-learner-tlevel-result-slips-file/{profileId}` | Yes | Allows downloading of a learner's T-level result slips using their profile ID. |
| `DownloadOverallResults.DownloadOverallResultSlipsFileAsync` | `download-tlevel-result-slips-file` | Yes | Provides a link to download overall T-level result slips. |
| `DownloadOverallResults.DownloadOverallResults` | `download-tlevel-results` | Yes | Shows details about overall T-level result availability. |
| `DownloadOverallResults.DownloadOverallResultsFileAsync` | `download-tlevel-results-file` | Yes | Allows downloading of T-level overall results in a file format. |
| `Help.AccessibilityStatement` | `accessibility-statement` | No | Displays the accessibility statement for the service. |
| `Help.Contact` | `contact-us` | No | Provides contact information for technical support or inquiries. |
| `Help.CookieDetails` | `cookie-details` | No | Displays details about cookie usage. |
| `Help.Cookies` | `cookies` | No | Provides general information about cookies used on the site. |
| `Help.ServiceUnavailable` | `service-unavailable` | No | Informs users about service unavailability during maintenance or freeze periods. |
| `Help.TermsAndConditions` | `terms-and-conditions` | No | Displays the terms and conditions for using the service. |
| `Help.UserGuide` | `user-guide` | No | Offers a user guide for navigating and utilizing the service. |
| `Home.Index` | — | No | — |
| `IndustryPlacement.AddIndustryPlacementAsync` | `add-industry-placement/{profileId}` | Yes | Facilitates adding or changing industry placement details for a learner. |
| `IndustryPlacement.IpCheckAndSubmitAsync` | `industry-placement-check-your-answers` | Yes | Allows users to review and submit their industry placement details. |
| `IndustryPlacement.IpCheckAndSubmitCancelAsync` | `industry-placement-check-your-answers-cancel/{profileId}` | Yes | Cancels the industry placement submission process and redirects back using a profile ID. |
| `IndustryPlacement.IpCheckAndSubmitSaveAsync` | `industry-placement-check-your-answers` | Yes | Allows the user to review and submit the answers for the industry placement. |
| `IndustryPlacement.IpCompletionAsync` | `industry-placement-completion/{profileId}/{isChangeMode:bool?}` | Yes | Allows the user to complete industry placement details, optionally in change mode. |
| `IndustryPlacement.IpSpecialConsiderationHoursAsync` | `industry-placement-special-consideration-hours/{isChangeMode:bool?}` | Yes | Allows the user to input the hours for special consideration related to industry placement. |
| `IndustryPlacement.IpSpecialConsiderationReasonsAsync` | `industry-placement-special-consideration-reasons/{isChangeMode:bool?}` | Yes | Allows the user to specify the reasons for special consideration in industry placement. |
| `IndustryPlacementImport.UploadIndustryPlacementsFile` | `upload-industry-placements-file/{requestErrorTypeId:int?}` | Yes | Allows the user to upload a file for bulk processing of industry placements, with optional error context. |
| `IndustryPlacementImport.UploadIndustryPlacementsFileAsync` | `upload-industry-placements-file` | Yes | Processes the file uploaded by the user for bulk industry placements. |
| `IndustryPlacementImport.UploadSuccessful` | `upload-ip-file-success` | Yes | Displays a success confirmation page after uploading the industry placements file. |
| `IndustryPlacementImport.UploadUnsuccessful` | `ip-upload-unsuccessful` | Yes | Shows an error page when the industry placements file upload fails. |
| `ManageRegistration.AmendActiveRegistrationAsync` | `amend-active-registration/{profileId}/{changeStatusId:int?}`, `amend-active-registration` | Yes | Allows modification of an active registration, including changing the status. |
| `ManageRegistration.AmendWithdrawRegistrationAsync` | `amend-withdrawn-registration/{profileId}/{changeStatusId:int?}`, `amend-withdrawn-registration` | Yes | Allows modification of a withdrawn registration, including status changes. |
| `ManageRegistration.CannotChangeAcademicYearAsync` | `academic-year-cannot-change/{profileId}` | Yes | Notifies the user that the academic year cannot be changed for specific registration. |
| `ManageRegistration.ChangeAcademicYearAsync` | `academic-year-change/{profileId}`, `submit-academic-year-change/{profileId}` | Yes | Allows the user to change the academic year of a learner's registration. |
| `ManageRegistration.ChangeAcademicYearConfirmationAsync` | `academic-year-change-confirmation` | Yes | Provides confirmation that the academic year has been successfully changed. |
| `ManageRegistration.ChangeConfirmationAsync` | `registration-details-change-confirmation` | Yes | Confirms that the registration details have been successfully changed. |
| `ManageRegistration.ChangeCoreAsync` | `change-core/{profileId}` | Yes | Lets the user change the core associated with a learner's registration. |
| `ManageRegistration.ChangeCoreQuestionAsync` | `change-core-and-provider/{profileId}`, `change-core-and-provider` | Yes | Allows users to indicate whether they can change their core and provider in their registration data. |
| `ManageRegistration.ChangeDateofBirthAsync` | `change-registration-learners-date-of-birth/{profileId}`, `change-registration-learners-date-of-birth` | Yes | Allows users to update the learner's date of birth in their registration data. |
| `ManageRegistration.ChangeLearnersNameAsync` | `change-registration-learners-name/{profileId}`, `change-registration-learners-name` | Yes | Allows users to update the learner's name in their registration data. |
| `ManageRegistration.ChangeProviderAndCoreNeedToWithdrawAsync` | `change-registration-provider-and-core-need-to-withdraw` | Yes | Informs users that they need to withdraw the registration to change the provider and core. |
| `ManageRegistration.ChangeProviderAsync` | `change-registration-provider/{profileId}/{isback:bool?}`, `change-registration-provider` | Yes | Allows users to update the provider in their registration data. |
| `ManageRegistration.ChangeProviderNotOfferingSameCoreAsync` | `change-registration-provider-not-offering-core` | Yes | Informs users that their selected provider does not offer the same core as the current registration. |
| `ManageRegistration.ChangeRegistrationSpecialismQuestionAsync` | `change-registration-learner-decided-specialism-question/{profileId}`, `change-registration-learner-decided-specialism-question` | Yes | Asks users whether the learner has decided on a specialism for their registration. |
| `ManageRegistration.ChangeSpecialismRestriction` | `registration-specialism-change-restriction/{profileId}` | Yes | Informs users about restrictions on changing the learner's specialism in their registration. |
| `ManageRegistration.ChangeSpecialismsAsync` | `change-registration-select-specialism/{profileId}`, `change-registration-select-specialism` | Yes | Allows users to select or change the learner's specialism in their registration data. |
| `ManageRegistration.PathwayNotEligibleForAcademicYearChangeAsync` | `pathway-not-eligible-for-academic-year-change/{profileId}` | Yes | Informs users that their registration pathway is not eligible for an academic year change. |
| `ManageRegistration.RegistrationCannotBeDeletedAsync` | `registration-cannot-be-deleted` | Yes | Informs users that the registration cannot be deleted, generally due to associated constraints. |
| `ManageRegistration.RegistrationCannotBeWithdrawnAsync` | `registration-cannot-be-withdrawn` | Yes | Informs users that the registration cannot be withdrawn, generally due to associated constraints. |
| `ManageRegistration.RejoinConfirmationAsync` | `registration-reactivated-confirmation` | Yes | Confirms that a withdrawn registration has been successfully reactivated. |
| `ManageRegistration.RejoinRegistrationAsync` | `reactivate-registration-same-course/{profileId}/{isFromCoreDenialPage:bool?}/{isChangeMode:bool?}`, `reactivate-registration-same-course` | Yes | Allows users to reactivate a withdrawn registration under the same course. |
| `ManageRegistration.ReregisterAcademicYearAsync` | `register-learner-new-course-select-academic-year/{profileId}/{isChangeMode:bool?}`, `register-learner-new-course-select-academic-year` | Yes | Allows users to select an academic year when registering a learner to a new course. |
| `ManageRegistration.ReregisterCannotSelectSameCoreAsync` | `cannot-select-same-core/{profileId}/{isChangeMode:bool?}` | Yes | Informs users that they cannot select the same core during re-registration for a learner. |
| `ManageRegistration.ReregisterCheckAndSubmitAsync` | `register-learner-new-course-check-and-submit/{profileId}`, `register-learner-new-course-check-and-submit` | Yes | Allows users to review and submit a new course registration for a learner. |
| `ManageRegistration.ReregisterCoreAsync` | `register-learner-new-course-select-core/{profileId}/{isChangeMode:bool?}`, `register-learner-new-course-select-core` | Yes | Facilitates the selection of a core for a learner's re-registration. |
| `ManageRegistration.ReregisterProviderAsync` | `register-learner-new-course-select-provider/{profileId}/{isChangeMode:bool?}/{isFromConfirmation:bool?}`, `register-learner-new-course-select-provider` | Yes | Enables users to select a provider for re-registering a learner for a new course. |
| `ManageRegistration.ReregisterSpecialismQuestionAsync` | `register-learner-new-course-has-learner-decided-specialism/{profileId}/{isChangeMode:bool?}`, `register-learner-new-course-has-learner-decided-specialism` | Yes | Asks whether the learner has decided on their specialism during re-registration. |
| `ManageRegistration.ReregisterSpecialismsAsync` | `register-learner-new-course-select-specialism/{profileId}/{isChangeMode:bool?}`, `register-learner-new-course-select-specialism` | Yes | Allows users to select a specialism for the learner during re-registration. |
| `ManageRegistration.ReregistrationConfirmationAsync` | `new-course-registration-confirmation` | Yes | Confirms the successful completion of a new course registration for a learner. |
| `ManageRegistration.ReviewChangeAcademicYearAsync` | `review-academic-year-change/{profileId}`, `review-academic-year-change` | Yes | Allows users to review the academic year change for a learner's registration. |
| `ManageRegistration.WithdrawConfirmationAsync` | `registration-withdrawn-confirmation` | Yes | Confirms the successful withdrawal of a registration for a learner. |
| `ManageRegistration.WithdrawRegistrationAsync` | `withdraw-registration/{profileId}/{withdrawBackLinkOptionId:int?}`, `withdraw-registration` | Yes | Allows users to withdraw a learner's registration. |
| `PostResultsService.PrsAddAppealAsync` | `post-results-add-appeal/{profileId}/{assessmentId}/{componentType}/{isBack:bool?}` | Yes | Allows the user to start an appeal process for a post-results service. |
| `PostResultsService.PrsAddAppealOutcomeAsync` | `post-results-add-appeal-outcome/{profileId}/{assessmentId}/{componentType}/{outcomeTypeId:int?}` | Yes | Enables the user to add an appeal outcome after initiating an appeal. |
| `PostResultsService.PrsAddAppealOutcomeKnownAsync` | `post-results-appeal-outcome-known/{profileId}/{assessmentId}/{componentType}/{outcomeKnownTypeId:int?}` | Yes | Lets the user specify an appeal outcome when the outcome is already known. |
| `PostResultsService.PrsAddRommAsync` | `post-results-add-romm/{profileId}/{assessmentId}/{componentType}/{isBack:bool?}` | Yes | Allows the user to start a Rationale of Marked Moderation (RoMM) request process. |
| `PostResultsService.PrsAddRommOutcomeAsync` | `post-results-add-romm-outcome/{profileId}/{assessmentId}/{componentType}/{outcomeTypeId:int?}` | Yes | Enables the user to add an RoMM outcome after initiating the request. |
| `PostResultsService.PrsAddRommOutcomeKnownAsync` | `post-results-romm-outcome-known/{profileId}/{assessmentId}/{componentType}/{outcomeKnownTypeId:int?}` | Yes | Lets the user specify an RoMM outcome when the outcome is already known. |
| `PostResultsService.PrsAppealCheckAndSubmitAsync` | `post-results-appeal-check` | Yes | Allows the user to review and submit the appeal process results. |
| `PostResultsService.PrsAppealGradeChangeAsync` | `post-results-appeal-change-grade/{profileId}/{assessmentId}/{componentType}/{isAppealOutcomeJourney:bool?}/{isChangeMode:bool?}` | Yes | Enables the user to change a learner's appeal grade. |
| `PostResultsService.PrsCancelAppealUpdateAsync` | `post-results-cancel-appeal-update` | Yes | Allows the user to cancel a previously submitted appeal update. |
| `PostResultsService.PrsCancelGradeChangeRequest` | `post-results-cancel-final-grade-change-request/{profileId}/{assessmentId}/{componentType}/{isResultJourney:bool?}` | Yes | Allows the user to cancel a grade change request in the context of a post-result journey. |
| `PostResultsService.PrsCancelGradeChangeRequestAsync` | `post-results-cancel-final-grade-change-request/{profileId}/{assessmentId}/{componentType}/{isResultJourney:bool?}` | Yes | Allows the user to cancel a grade change request with async handling. |
| `PostResultsService.PrsCancelRommUpdateAsync` | `post-results-cancel-ROMM-update` | Yes | Enables the user to cancel an update related to a Rationale of Marked Moderation (RoMM). |
| `PostResultsService.PrsGradeChangeRequestAsync` | `post-results-final-grade-change-request/{profileId}/{assessmentId}/{componentType}` | Yes | Allows the user to request a change in the final grade of a learner post-results. |
| `PostResultsService.PrsGradeChangeRequestConfirmation` | `post-results-final-grade-change-request-sent` | Yes | Displays a confirmation page for the final grade change request. |
| `PostResultsService.PrsGradeChangeRequestConfirmationAsync` | `post-results-final-grade-change-request-sent` | Yes | Provides confirmation of the user's final grade change request asynchronously. |
| `PostResultsService.PrsLearnerDetailsAsync` | `post-results-learners-grades/{profileId}` | Yes | Displays learner grades associated with the specified profile ID. |
| `PostResultsService.PrsNoResultsAsync` | `post-results-no-results/{profileId}` | Yes | Displays information about a learner who has no results for the specified profile ID. |
| `PostResultsService.PrsRommCheckAndSubmitAsync` | `post-results-romm-check` | Yes | Allows submission of ROMM (Review of Moderation and Marking) checks and decisions. |
| `PostResultsService.PrsRommGradeChangeAsync` | `post-results-romm-change-grade/{profileId}/{assessmentId}/{componentType}/{isRommOutcomeJourney:bool?}/{isChangeMode:bool?}` | Yes | Facilitates the process of changing a learner's grade through ROMM for the specified assessment and profile. |
| `PostResultsService.PrsUlnWithdrawnAsync` | `post-results-learner-withdrawn/{profileId}` | Yes | Displays details of a withdrawn learner using their profile ID. |
| `PostResultsService.ResultReviewsAndAppealsAsync` | `results-reviews-appeals-and-grade-changes` | Yes | Provides information on result reviews, appeals, and grade changes. |
| `PostResultsService.RommsDownloadDataAsync` | `romms-download-data` | Yes | Displays a page for downloading ROMMs data. |
| `PostResultsService.RommsDownloadDataLinkAsync` | `download-romms-data/{id}` | Yes | Enables downloading specific ROMMs data files using an ID. |
| `PostResultsService.RommsGeneratingDownload` | `romms-generating-download` | Yes | Indicates that ROMMs data is being prepared for download. |
| `PostResultsService.RommsNoRecordsFound` | `romms-no-records-found` | Yes | Displays a message about no ROMMs records being found. |
| `PostResultsService.StartReviewsAndAppealsAsync` | `post-results-reviews-appeals-and-grade-changes` | Yes | Initiates the process of reviews, appeals, and grade changes for post-results services. |
| `PostResultsService.SubmitRommsGeneratingDownloadAsync` | `romms-generating-download` | Yes | Starts the process for generating ROMMs data exports. |
| `PostResultsService.UploadRommsFile` | `upload-romms-file/{requestErrorTypeId:int?}` | Yes | Allows users to upload a ROMMs file with optional error type indication. |
| `PostResultsService.UploadRommsFileAsync` | `upload-romms-file` | Yes | Processes the uploaded ROMMs file. |
| `PostResultsService.UploadRommsSuccessful` | `romms-upload-success` | Yes | Displays a confirmation of successful ROMMs file upload. |
| `PostResultsService.UploadRommsUnsuccessful` | `romms-upload-unsuccessful` | Yes | Allows the user to view an unsuccessful ROMMs upload result. |
| `Provider.AddProviderTlevelsAsync` | `add-additional-tlevels/{providerId}` | Yes | Enables the user to add new T-levels to the selected provider. |
| `Provider.ConfirmationAsync` | `submit-successful` | Yes | Confirms the successful submission of an action with the provider. |
| `Provider.FindProviderAsync` | `find-provider/{isback:bool?}`, `find-provider` | Yes | Allows the user to search and find a provider to manage. |
| `Provider.RemoveConfirmationAsync` | `tlevel-removed-confirmation` | Yes | Confirms that a provider T Level has been successfully removed. |
| `Provider.RemoveProviderTlevelAsync` | `remove-tlevel/{id}/{navigation:bool?}`, `remove-tlevel` | Yes | Allows the user to remove a T Level from a provider. |
| `Provider.SelectProviderTlevelsAsync` | `select-providers-tlevels/{providerId}`, `add-additional-tlevels` | Yes | Allows the user to select or add additional T Levels for a specific provider. |
| `Provider.ViewProviderTlevelsAsync` | `provider-tlevels/{providerId}/{navigation:bool?}` | Yes | Displays a list of T Levels assigned to a specific provider. |
| `Provider.YourProvidersAsync` | `your-providers` | Yes | Displays a list of providers associated with the user. |
| `ProviderAddress.AddAddressAsync` | `add-address` | Yes | Redirects the user to add the provider's address by postcode. |
| `ProviderAddress.AddAddressCancelAsync` | `add-postal-address-cancel` | Yes | Lets the user cancel adding a postal address. |
| `ProviderAddress.AddAddressCheckAndSubmitAsync` | `add-postal-address-check-and-submit` | Yes | Displays a summary page for checking and submitting a postal address entry. |
| `ProviderAddress.AddAddressConfirmationAsync` | `add-postal-address-confirmation` | Yes | Confirms that adding a postal address was successful. |
| `ProviderAddress.AddAddressManuallyAsync` | `add-address-manually/{isFromSelectAddress:bool?}/{isFromAddressMissing:bool?}` | Yes | Allows the user to manually add a postal address. |
| `ProviderAddress.AddAddressNotFoundAsync` | `add-postal-address-no-addresses-found` | Yes | Informs users that no postal addresses were found for the given postcode. |
| `ProviderAddress.AddAddressPostcodeAsync` | `add-postal-address-postcode/{showPostcode:bool?}/{isFromAddressMissing:bool?}`, `add-postal-address-postcode` | Yes | Lets the user provide or confirm a postcode for adding a postal address. |
| `ProviderAddress.AddAddressSelectAsync` | `add-postal-address-select` | Yes | Allows the user to select a postal address from a list of available addresses. |
| `ProviderAddress.AddPostalAddressManualAsync` | `add-postal-address-manual/{isFromSelectAddress:bool?}/{isFromAddressMissing:bool?}`, `add-postal-address-manual` | Yes | Displays a form for manually adding a postal address. |
| `ProviderAddress.ManagePostalAddressAsync` | `manage-postal-address` | Yes | Displays the current postal address for management purposes. |
| `ProviderAddress.SubmitAddAddressCheckAndSubmitAsync` | `add-postal-address-check-and-submit` | Yes | Submits the postal address after review and confirmation. |
| `ProviderAddress.SubmitAddAddressNotFoundAsync` | `add-postal-address-no-addresses-found` | Yes | Resets the operation after no postal addresses are found. |
| `ProviderRegistrations.DownloadRegistrationsDataAsync` | `download-registrations-data` | Yes | Allows the user to download registration data for providers. |
| `ProviderRegistrations.DownloadRegistrationsDataForAsync` | `download-registrations-data-for` | Yes | Allows the user to download registration data for a specific year. |
| `ProviderRegistrations.DownloadRegistrationsDataForLinkAsync` | `download-registrations-data-for/{id}` | Yes | Provides a download link for a specific set of registration data. |
| `Registration.AddRegistrationAcademicYearAsync` | `add-registration-academic-year/{isChangeMode:bool?}`, `add-registration-academic-year` | Yes | Allows the user to select an academic year for a new registration. |
| `Registration.AddRegistrationAsync` | `add-registration-unique-learner` | Yes | Begins the process of adding a new learner registration. |
| `Registration.AddRegistrationCheckAndSubmitAsync` | `add-registration-check-and-submit` | Yes | Allows the user to review and submit all details of a new registration. |
| `Registration.AddRegistrationConfirmationAsync` | `add-registration-confirmation` | Yes | Confirms that a new learner registration was successfully submitted. |
| `Registration.AddRegistrationCoreAsync` | `add-registration-core/{isChangeMode:bool?}`, `add-registration-core` | Yes | Allows the user to select a core for a new learner registration. |
| `Registration.AddRegistrationDateofBirthAsync` | `add-registration-date-of-birth/{isChangeMode:bool?}`, `add-registration-date-of-birth` | Yes | Allows the user to enter the date of birth for a new learner registration. |
| `Registration.AddRegistrationLearnersNameAsync` | `add-registration-learners-name/{isChangeMode:bool?}`, `add-registration-learners-name` | Yes | Allows the user to add or update the learner's name during registration. |
| `Registration.AddRegistrationProviderAsync` | `add-registration-provider/{isChangeMode:bool?}`, `add-registration-provider` | Yes | Lets the user select or update the provider for registration. |
| `Registration.AddRegistrationSpecialismQuestionAsync` | `add-registration-learner-decided-specialism-question/{isChangeMode:bool?}`, `add-registration-learner-decided-specialism-question` | Yes | Enables the user to answer whether the learner has decided on a specialism during registration. |
| `Registration.AddRegistrationSpecialismsAsync` | `add-registration-specialism/{isChangeMode:bool?}`, `add-registration-specialism` | Yes | Allows the user to select the learner's specialism(s) during registration. |
| `Registration.AddRegistrationUlnAsync` | `add-registration-unique-learner-number/{isChangeMode:bool?}`, `add-registration-unique-learner-number` | Yes | Lets the user add or update the Unique Learner Number (ULN) for registration. |
| `Registration.DeleteRegistrationAsync` | `delete-registration/{profileId}`, `delete-registration` | Yes | Enables the user to delete a registration record. |
| `Registration.Index` | `registrations` | Yes | Acts as the registration dashboard for users. |
| `Registration.PendingWithdrawalsDownloadDataLinkAsync` | `download-pending-withdrawals-data/{id}` | Yes | Provides users with an option to download data related to pending withdrawals. |
| `Registration.ProblemWithRegistrationsUpload` | `problem-with-registrations-upload` | Yes | Displays a page for users encountering issues with registration uploads. |
| `Registration.RegistrationCancelledConfirmationAsync` | `registration-deleted-confirmation` | Yes | Confirms the registration cancellation to the user. |
| `Registration.RegistrationDetailsAsync` | `search-for-registration-registration-details/{profileId}` | Yes | Shows detailed information about a specific registration. |
| `Registration.RegistrationsDownloadDataAsync` | `registrations-download-data` | Yes | Allows users to generate and download registration data. |
| `Registration.RegistrationsDownloadDataLinkAsync` | `download-registrations-data/{id}` | Yes | Provides direct access to download registration data files. |
| `Registration.RegistrationsGeneratingDownload` | `registrations-generating-download` | Yes | Informs users that the registration data generation process is ongoing. |
| `Registration.RegistrationsNoRecordsFound` | `registrations-no-records-found` | Yes | Notifies users when no registration records are found for a given action. |
| `Registration.SubmitRegistrationCheckAndSubmitAsync` | `add-registration-check-and-submit` | Yes | Allows the user to review and confirm the registration details before submitting. |
| `Registration.SubmitRegistrationsGeneratingDownloadAsync` | `registrations-generating-download` | Yes | Starts the generation of downloadable data for registrations. |
| `Registration.UlnCannotBeRegistered` | `ULN-cannot-be-registered` | Yes | Informs the user that the provided Unique Learner Number (ULN) cannot be registered. |
| `Registration.UploadRegistrationsFile` | `upload-registrations-file/{requestErrorTypeId:int?}` | Yes | Displays the form to upload registration files. |
| `Registration.UploadRegistrationsFileAsync` | `upload-registrations-file` | Yes | Processes the uploaded registration file. |
| `Registration.UploadSuccessful` | `upload-registrations-file-success` | Yes | Displays success information after uploading a registration file. |
| `Registration.UploadUnsuccessful` | `registrations-upload-unsuccessful` | Yes | Displays error information when a registration upload fails. |
| `Registration.UploadWithdrawalsFile` | `upload-withdrawals-file/{requestErrorTypeId:int?}` | Yes | Displays the form to upload withdrawal files. |
| `Registration.UploadWithdrawalsFileAsync` | `upload-withdrawals-file` | Yes | Processes the uploaded withdrawal file. |
| `Registration.UploadWithdrawalsSuccessful` | `upload-withdrawals-file-success` | Yes | Displays success information after uploading a withdrawal file. |
| `Registration.UploadWithdrawalsUnsuccessful` | `withdrawals-upload-unsuccessful` | Yes | Displays error information when a withdrawal upload fails. |
| `Result.AddCoreResultAsync` | `select-core-result/{profileId}/{assessmentId}`, `select-core-result` | Yes | Allows the user to add or update core results for a learner's profile. |
| `Result.AddSpecialismResultAsync` | `select-specialism-result/{profileId}/{assessmentId}` | Yes | Allows the user to add or update specialism results for a learner's profile. |
| `Result.ChangeCoreResultAsync` | `change-core-result/{profileId}/{assessmentId}` | Yes | Allows the user to change the core results for a learner's profile. |
| `Result.ChangeSpecialismResultAsync` | `change-specialism-result/{profileId}/{assessmentId}` | Yes | Allows the user to change the specialism results for a learner's profile. |
| `Result.Index` | `results` | Yes | Offers a dashboard with an overview of results. |
| `Result.ProblemWithResultsUpload` | `results-file-upload-service-problem` | Yes | Informs the user about issues encountered during results file upload. |
| `Result.ResultDetailsAsync` | `learner-results/{profileId}` | Yes | Displays the detailed results of a specific learner based on their profile ID. |
| `Result.ResultWithdrawnDetailsAsync` | `results-learner-withdrawn/{profileId}` | Yes | Shows the details of a withdrawn learner's results based on their profile ID. |
| `Result.ResultsDownloadDataAsync` | `results-download-data` | Yes | Allows the downloading of data for all results. |
| `Result.ResultsDownloadDataLinkAsync` | `download-results-data/{id}/{componentType}` | Yes | Generates a specific download link for results data based on ID and component type. |
| `Result.ResultsGeneratingDownload` | `results-generating-download` | Yes | Indicates that results data is being prepared for download. |
| `Result.ResultsNoRecordsFound` | `results-no-records-found` | Yes | Notifies the user when no records were found for results. |
| `Result.SubmitResultsGeneratingDownloadAsync` | `results-generating-download` | Yes | Finalizes the process for generating results for download. |
| `Result.UploadResultsFile` | `upload-results-file/{requestErrorTypeId:int?}` | Yes | Provides a page for uploading result files, optionally based on a request error type. |
| `Result.UploadResultsFileAsync` | `upload-results-file` | Yes | Processes the results file uploaded by the user. |
| `Result.UploadSuccessful` | `results-upload-confirmation` | Yes | Informs the user that the results file was successfully uploaded. |
| `Result.UploadUnsuccessful` | `results-upload-unsuccessful` | Yes | Informs the user about unsuccessful results upload attempts. |
| `SearchRegistration.SearchRegistrationAsync` | `search-learner` | Yes | Allows the user to search for a learner's registrations. |
| `SearchRegistration.SearchRegistrationClearAsync` | `search-learner-clear` | Yes | Clears the user's search state and redirects back to the search page. |
| `SearchRegistration.SearchRegistrationClearFiltersAsync` | `search-learner-clear-filters` | Yes | Clears all applied filters to start a fresh search. |
| `SearchRegistration.SearchRegistrationClearKeyAsync` | `search-learner-clear-key` | Yes | Clears the search key applied in the search. |
| `SearchRegistration.SearchRegistrationFiltersAsync` | `search-learner-filters` | Yes | Applies filters to search for learner registrations. |
| `SearchRegistration.SearchRegistrationSearchKeyAsync` | `search-learner-search-key` | Yes | Applies specific keywords for searching learner registrations. |
| `StatementOfAchievement.ChangeComponentAchievement` | `request-statement-of-achievement-change-learner-components/{profileId}` | Yes | Allows the user to change the learner's component achievements. |
| `StatementOfAchievement.ChangePostalAddress` | `request-statement-of-achievement-change-postal-address/{profileId}` | Yes | Allows the user to update the postal address for a statement of achievement. |
| `StatementOfAchievement.PostalAddressMissing` | `postal-address-missing` | Yes | Informs the user when the postal address for a learner is missing. |
| `StatementOfAchievement.RequestSoaAlreadySubmittedAsync` | `request-statement-of-achievement-already-requested/{profileId}/{pathwayId}` | Yes | Notifies the user that a request for a statement of achievement has already been submitted. |
| `StatementOfAchievement.RequestSoaCancel` | `request-statement-of-achievement-cancel` | Yes | Allows the user to cancel a statement of achievement request. |
| `StatementOfAchievement.RequestSoaCancelAsync` | `request-statement-of-achievement-cancel/{profileId}` | Yes | Confirms and processes the cancellation of a statement of achievement for a specific learner profile. |
| `StatementOfAchievement.RequestSoaCheckAndSubmitAsync` | `request-statement-of-achievement-check-and-submit/{profileId}` | Yes | Allows the user to review and confirm the submission of a statement of achievement request. |
| `StatementOfAchievement.RequestSoaConfirmationAsync` | `request-statement-of-achievement-confirmation` | Yes | Provides confirmation that a statement of achievement has been successfully requested. |
| `StatementOfAchievement.RequestSoaNotAvailableNoIpStatusAsync` | `/request-statement-of-achievement-not-available-no-ip-status` | Yes | Informs the user that a statement of achievement is unavailable due to missing Industry Placement status. |
| `StatementOfAchievement.RequestSoaNotAvailableNoResultsAsync` | `request-statement-of-achievement-not-available-no-results` | Yes | Displays a message indicating the statement of achievement is not available due to missing pathway results or industry placement completion. |
| `StatementOfAchievement.RequestSoaUlnNotFoundAsync` | `request-statement-of-achievement-ULN-not-registered` | Yes | Shows a message when the submitted Unique Learner Number (ULN) is not registered in the system. |
| `StatementOfAchievement.RequestSoaUlnNotWithdrawnAsync` | `request-statement-of-achievement-ULN-not-withdrawn` | Yes | Displays learner details when the learner has not been withdrawn and error conditions are met. |
| `StatementOfAchievement.RequestSoaUniqueLearnerNumberAsync` | `request-statement-of-achievement-unique-learner-number` | Yes | Allows users to request a statement of achievement by searching for a learner using their Unique Learner Number (ULN). |
| `StatementOfAchievement.StatementsOfAchievementNotAvailable` | `SoA-unavailable` | Yes | Informs users that statements of achievement are not currently available. |
| `StatementOfAchievement.SubmitRequestSoaCheckAndSubmitAsync` | `request-statement-of-achievement-check-and-submit` | Yes | Validates the learner's record and submits a request for a statement of achievement. |
| `Timeout.TimeoutConfirmation` | `timeout` | No | Displays a confirmation page after the user's session times out. |
| `Tlevel.AllTlevelsReviewedAsync` | `all-tlevels-reviewed` | Yes | Confirms that all T levels have been reviewed and no additional reviews are pending. |
| `Tlevel.ConfirmTlevelAsyc` | `confirm-tlevel` | Yes | Allows users to confirm the accuracy of a T level after reviewing its details. |
| `Tlevel.ConfirmationAsync` | `tlevel-details-queried-confirmation/{id}` | Yes | Displays confirmation details for a T level that has been reviewed or queried, based on its review status. |
| `Tlevel.ConfirmedTlevelsAsync` | `confirmed-tlevels` | Yes | Displays a list of confirmed T levels that have been reviewed successfully. |
| `Tlevel.DetailsAsync` | `tlevel-details/{id}` | Yes | Shows detailed information about a specific T level, including its pathway ID. |
| `Tlevel.Index` | `tlevels` | Yes | Serves as a dashboard for managing T levels. |
| `Tlevel.NoConfirmedTlevelsAsync` | `no-confirmed-tlevels` | Yes | Informs users that no T levels have been confirmed yet. |
| `Tlevel.NoQueriedTlevelsAsync` | `no-queried-tlevels` | Yes | Informs users that no T levels have been queried yet. |
| `Tlevel.QueriedDetailsAsync` | `tlevel-queried-details/{id}` | Yes | Displays details of a queried T Level qualification. |
| `Tlevel.QueriedTlevelsAsync` | `queried-tlevels` | Yes | Shows all T Levels that have been marked as queried. |
| `Tlevel.QueryServiceProblem` | `query-service-problem` | Yes | Displays an error page for issues encountered while querying a T Level. |
| `Tlevel.ReportIssueAsync` | `query-t-level/{id}/{isBackToConfirmed:bool?}` | Yes | Allows users to report an issue with a T Level qualification. |
| `Tlevel.ReportIssueSentAsync` | `tlevel-query-sent` | Yes | Confirms that a query or issue related to a T Level has been successfully submitted. |
| `Tlevel.ReviewTlevelsAsync` | `review-tlevels` | Yes | Guides users to review pending T Levels. |
| `Tlevel.SelectToReviewAsync` | `select-tlevel/{id:int?}`, `select-tlevel` | Yes | Allows users to select a T Level they want to review. |
| `Tlevel.VerifyAsync` | `review-t-level-details/{id}/{isback:bool?}` | Yes | Displays detailed information for verifying a specific T Level qualification. |
| `TrainingProvider.AddWithdrawnStatusAsync` | `manage-learners-add-withdrawn-status/{profileId}`, `manage-add-withdrawn-status` | Yes | Lets a training provider mark a learner record as withdrawn. |
| `TrainingProvider.ChangeBackToActiveAOMessageAsync` | `restore-learner-ao-message/{profileId}`, `restore-learner-ao-message` | Yes | Displays a message about restoring a learner's status back to active for the AO. |
| `TrainingProvider.ChangeBackToActiveStatusAsync` | `restore-learner-ao/{profileId}`, `restore-learner-ao` | Yes | Allows training providers to restore a learner's status from withdrawn to active. |
| `TrainingProvider.ChangeBackToActiveStatusHaveYouToldAwardingOrganisationAsync` | `restore-learner-have-you-told-ao/{profileId}`, `restore-learner-have-you-told-ao` | Yes | Confirms whether the training provider has informed the Awarding Organisation about the status change. |
| `TrainingProvider.ChangeWithdrawnStatusHaveYouToldAwardingOrganisationAsync` | `manage-add-withdrawn-status-ao-message/{profileId}`, `manage-add-withdrawn-status-ao-message` | Yes | Checks whether the training provider notified the Awarding Organisation about learner withdrawal. |
| `TrainingProvider.LearnerRecordDetailsAsync` | `learner-record-page/{profileId}` | Yes | Displays detailed information about a learner's record. |
| `TrainingProvider.ProviderGuidance` | `provider-guidance` | Yes | Provides guidance for training providers. |
| `TrainingProvider.ProviderTimeline` | `provider-timeline` | Yes | Provides a timeline view for training providers, offering guidance on key events and processes. |
| `TrainingProvider.RequestReplacementDocumentAsync` | `request-replacement-document/{profileId}` | Yes | Allows the user to submit a request for a replacement document for a learner profile. |
| `TrainingProvider.SearchLearnerClearFiltersAsync` | `manage-learners-clearfilters/{academicYear}` | Yes | Resets any applied filters when managing learners for a specific academic year. |
| `TrainingProvider.SearchLearnerClearKeyAsync` | `manage-learners-clearsearchkey/{academicYear}` | Yes | Clears the search key used to find learners for a given academic year. |
| `TrainingProvider.SearchLearnerDetailsAsync` | `manage-learners/{academicYear}/{pageNumber:int?}`, `manage-learners/{academicYear}` | Yes | Displays a paginated list of learner details based on search criteria and academic year. |
| `TrainingProvider.SearchLearnerRecordAsync` | `search-learner-records` | Yes | Allows the user to search for a learner record using their unique learner number (ULN). |
| `TrainingProvider.SearchLearnerRecordNotFoundAsync` | `search-learner-record-ULN-not-registered` | Yes | Informs the user that the searched learner's ULN is not registered. |
| `TrainingProvider.SubmitSearchLearnerApplyFiltersAsync` | `manage-learners-applyfilters` | Yes | Applies selected filters to search learner records. |
| `TrainingProvider.SubmitWithdrawLearnerAOMessageAsync` | `withdraw-learner-ao-message` | Yes | Submits the confirmation message related to withdrawing a learner after informing the awarding organization. |
| `TrainingProvider.WithdrawLearnerAOMessageAsync` | `withdraw-learner-ao-message/{profileId}` | Yes | Displays a message about withdrawing a learner and the process required for notifying the awarding organization. |
