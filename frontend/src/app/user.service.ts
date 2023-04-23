import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
	StudySession,
	StudySessionDetail,
	Quiz,
	SuccessResponse,
	QuizQuestion,
} from './interfaces';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	backend_url = 'http://128.122.49.69:20440';

	constructor(private http: HttpClient) {}

	// get list of all sessions
	getStudySessions(user_email: string) {
		let queryParams = new HttpParams();
		queryParams = queryParams.append('user_id', user_email);
		return this.http.get<StudySession[]>(
			this.backend_url + '/get-sessions',
			{
				params: queryParams,
			}
		);
		// return this.http.get<StudySession[]>('/assets/sessions.json');
	}

	// get details of a specific session with notes
	getStudySessionNotes(user_email: string, session_id: string) {
		let queryParams = new HttpParams();
		queryParams = queryParams.append('user_id', user_email);
		queryParams = queryParams.append('session_id', session_id);
		return this.http.get<StudySessionDetail>(
			this.backend_url + '/get-session',
			{
				params: queryParams,
			}
		);
		// return this.http.get<StudySessionDetail>('/assets/notes.json');
	}

	// get quiz questions & answers for a specific session
	getQuiz(user_email: string, session_id: string) {
		let queryParams = new HttpParams();
		queryParams = queryParams.append('user_id', user_email);
		queryParams = queryParams.append('session_id', session_id);
		return this.http.get<Quiz>(this.backend_url + '/questions', {
			params: queryParams,
		});
		// return this.http.get<Quiz>('/assets/quiz.json');
	}

	// generate quiz questions & answers for a specific session
	generateQuiz(user_email: string, session_id: string) {
		return this.http.post<SuccessResponse>(
			this.backend_url + '/generate-questions',
			{
				user_id: user_email,
				session_id: session_id,
			}
		);
		// return {
		// 	status: 'ok',
		// };
	}

	getFeedback(
		user_email: string,
		session_id: string,
		quiz_question: QuizQuestion,
		provided_attempt: string[]
	) {
		return this.http.post<string>(this.backend_url + '/feedback', {
			user_id: user_email,
			session_id: session_id,
			question: quiz_question.question,
			reference_answer: quiz_question.answer,
			chosen_answer: provided_attempt,
			context: quiz_question.context,
			references: quiz_question.references,
		});
		// return 'Correct Answer!';
	}
}
