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
	quiz: Quiz;
}
export interface Note {
	type: string;
	content: string | string[];
	reference: string;
}

export interface Quiz {
	questions: QuizQuestion[];
	num_questions: number;
	stats: Stats;
}

export interface Stats {
	total: number;
	correct: number;
}
export interface QuizQuestion {
	question_type: string;
	question: string;
	context: string;
	answer: string[];
	options: string[];
	references: string[];
}

export interface Feedback {
	status: string;
	feedback: string;
	references: string[];
}
export interface SuccessResponse {
	status: string;
}

export interface SessionStats {
	piechart: string;
	wordcloud: string;
	score: string;
}

export interface GlobalStats {
	bar_graph: string;
	pie_chart: string;
	line_chart: string;
}
