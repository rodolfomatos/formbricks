import { TUserNotificationSettings } from "@formbricks/types/user";

/** Shape of a membership with nested organization and workspace data for notification settings. */
export interface Membership {
  organization: {
    id: string;
    name: string;
    workspaces: {
      id: string;
      name: string;
      surveys: {
        id: string;
        name: string;
      }[];
    }[];
  };
}

export interface User {
  id: string;
  notificationSettings: TUserNotificationSettings;
}
