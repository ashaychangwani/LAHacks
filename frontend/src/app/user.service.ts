import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { StudySession, StudySessionDetail, Quiz, SuccessResponse } from './interfaces';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	constructor(private http: HttpClient) {}

	// get list of all sessions
	getStudySessions(user_email: string) {
		// let queryParams = new HttpParams();
		// queryParams = queryParams.append("user_id", user_email);
		// return this.http.get<StudySession[]>(
		//   '/get-sessions',
		//   {params:queryParams}
		// );
		return this.http.get<StudySession[]>('/assets/sessions.json');
	}

	// get details of a specific session with notes
	getStudySessionNotes(user_email: string, session_id: string) {
		// let queryParams = new HttpParams();
		// queryParams = queryParams.append("user_id", user_email);
		// queryParams = queryParams.append("session_id", session_id);
		// return this.http.get<StudySessionDetail>(
		//   '/get-session',
		//   {params:queryParams}
		// );
		return this.http.get<StudySessionDetail>('/assets/notes.json');
	}

	// get quiz questions & answers for a specific session
	getQuiz(user_email: string, session_id: string) {
		// let queryParams = new HttpParams();
		// queryParams = queryParams.append("user_id", user_email);
		// queryParams = queryParams.append("session_id", session_id);
		// return this.http.get<Quiz[]>(
		//   '/question',
		//   {params:queryParams}
		// );
		return this.http.get<Quiz[]>('/assets/quiz.json');
	}

	generateQuiz(user_email: string, session_id: string) {	
		// return this.http.post<SuccessResponse>('/generate-questions', {
		// 	user_id: user_email,
		// 	session_id: session_id,
		// });
		return {
			status: 'ok',
		};
	}
}
