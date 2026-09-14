"use client";

import { MailIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TSurveyFollowUp } from "@formbricks/types/surveys/follow-up";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { TFollowUpEmailToUser } from "@/modules/survey/editor/types/survey-follow-up";
import { FollowUpItem } from "@/modules/survey/follow-ups/components/follow-up-item";
import { FollowUpModal } from "@/modules/survey/follow-ups/components/follow-up-modal";
import { Button } from "@/modules/ui/components/button";

/** Main view for managing survey follow-up email actions. Lists existing follow-ups with an add-new button. */
interface FollowUpsViewProps {
  localSurvey: TSurvey;
  setLocalSurvey: React.Dispatch<React.SetStateAction<TSurvey>>;
  selectedLanguageCode: string;
  mailFrom: string;
  userEmail: string;
  teamMemberDetails: TFollowUpEmailToUser[];
  locale: TUserLocale;
}

export const FollowUpsView = ({
  localSurvey,
  setLocalSurvey,
  selectedLanguageCode,
  mailFrom,
  userEmail,
  teamMemberDetails,
  locale,
}: FollowUpsViewProps) => {
  const { t } = useTranslation();
  const [addFollowUpModalOpen, setAddFollowUpModalOpen] = useState(false);

  const surveyFollowUps: TSurveyFollowUp[] = localSurvey.followUps.filter((f) => !f.deleted);

  return (
    <div className="mt-12 space-y-4 p-5">
      <div className="flex justify-end">
        {surveyFollowUps.length ? (
          <Button size="sm" onClick={() => setAddFollowUpModalOpen(true)}>
            + {t("workspace.surveys.edit.follow_ups_new")}
          </Button>
        ) : null}
      </div>

      <div>
        {!surveyFollowUps.length && (
          <div className="flex flex-col items-center gap-y-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <div className="flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 p-2">
              <MailIcon className="size-6 text-slate-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {t("workspace.surveys.edit.follow_ups_empty_heading")}
              </p>
              <p className="text-sm text-slate-500">
                {t("workspace.surveys.edit.follow_ups_empty_description")}
              </p>
            </div>

            <Button className="w-fit" size="sm" onClick={() => setAddFollowUpModalOpen(true)}>
              {t("workspace.surveys.edit.follow_ups_new")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-y-2">
        {surveyFollowUps.map((followUp) => {
          return (
            <FollowUpItem
              key={followUp.id}
              followUp={followUp}
              localSurvey={localSurvey}
              setLocalSurvey={setLocalSurvey}
              selectedLanguageCode={selectedLanguageCode}
              mailFrom={mailFrom}
              userEmail={userEmail}
              teamMemberDetails={teamMemberDetails}
              locale={locale}
            />
          );
        })}
      </div>

      <FollowUpModal
        localSurvey={localSurvey}
        setLocalSurvey={setLocalSurvey}
        open={addFollowUpModalOpen}
        setOpen={setAddFollowUpModalOpen}
        selectedLanguageCode={selectedLanguageCode}
        mailFrom={mailFrom}
        userEmail={userEmail}
        teamMemberDetails={teamMemberDetails}
        locale={locale}
      />
    </div>
  );
};
