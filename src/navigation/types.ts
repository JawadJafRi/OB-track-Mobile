/**
 * Screens now pass a task id rather than a bag of display strings. The detail
 * screens re-read the task from the API, so what they show is whatever the
 * server actually recorded — not a snapshot assembled on the previous screen.
 */
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ActiveTask: { taskId: string };
  TaskCompleted: { taskId: string };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};
