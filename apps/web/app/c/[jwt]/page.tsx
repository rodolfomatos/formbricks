import { ContactSurveyPage, generateMetadata } from "@/modules/survey/link/contact-survey/page";

/**
 * Route: `/c/[jwt]` (unauthenticated). Contact-linked survey page, identified
 * by a JWT token embedded in the URL.
 */
export { generateMetadata };
export default ContactSurveyPage;
