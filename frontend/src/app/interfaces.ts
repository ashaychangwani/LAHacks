export interface StudySession {
  session_id: string;
  session_name: string;
  created_at: Date;
  ended_at: Date;
}

export interface Note {
    type: string;
    content: string | string[];
}
