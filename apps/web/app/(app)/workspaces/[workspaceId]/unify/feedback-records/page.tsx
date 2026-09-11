import { FeedbackRecordsPage } from "@/modules/ee/unify-feedback/page";

const Page = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const params = await props.params;
  return <FeedbackRecordsPage params={params} />;
};

export default Page;
