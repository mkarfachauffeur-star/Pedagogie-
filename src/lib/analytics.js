export {
  GA_MEASUREMENT_ID,
  getGaMeasurementId,
  getGaScriptSrc,
  initGoogleAnalytics,
  isGaDebugEnabled,
  trackGtagEvent,
  trackPageView,
} from './gtag'

export {
  trackEvent,
  trackDemoRequestClick,
  trackDemoFormSubmit,
  trackBookDemo,
  trackLogin,
  trackOrganizationCreated,
  trackSignUp,
  trackAePendingValidation,
  trackAeApproved,
  trackBeginTrial,
  trackFirstLogin,
  trackPurchase,
  trackSubscriptionRenewed,
  trackSubscriptionCancelled,
  trackDeleteAccount,
  trackContactFormSubmit,
  trackAutomaticNotificationSent,
  trackExportCsv,
  trackExportExcel,
  trackExportPdf,
} from './analytics/events'

export {
  hasTrackedOnce,
  markTrackedOnce,
  onceKey,
  trackOnce,
  trackOrgOnce,
  trackUserOnce,
} from './analytics/once'

export {
  trackFirstStudentMilestones,
  trackFirstTeacherMilestone,
  trackFirstVehicleMilestone,
  trackFirstLessonMilestone,
  trackFirstExamMilestone,
  trackFirstMessageMilestone,
  trackFirstDocumentMilestone,
} from './analytics/milestones'
