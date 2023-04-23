export interface StudySession {
	session_id: string;
	session_name: string;
	created_at: Date;
	ended_at: Date;
}

export interface StudySessionDetail {
	session_id: string;
	session_name: string;
	created_at: Date;
	ended_at: Date;
	blobs: Note[];
}
export interface Note {
	type: string;
	content: string | string[];
}

export interface Quiz {
	question_type: string;
	question: string;
	answer: string[];
	options: string[];
}

export interface SuccessResponse {
	status: string;
}
