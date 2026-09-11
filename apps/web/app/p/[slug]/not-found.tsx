import { LinkSurveyNotFound } from "@/modules/survey/link/not-found";

/**
 * 404 page for the `/p/[slug]` pretty URL route.
 */
export default function NotFound() {
  return <LinkSurveyNotFound />;
}
