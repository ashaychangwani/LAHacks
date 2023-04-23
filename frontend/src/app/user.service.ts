import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
	StudySession,
	StudySessionDetail,
	Quiz,
	SuccessResponse,
	QuizQuestion,
	Feedback,
	SessionStats,
	GlobalStats,
} from './interfaces';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	backend_url = 'http://128.122.49.69:20440';
	// backend_url = 'http://192.168.65.207:8000';
	test = false;

	constructor(private http: HttpClient) {}

	// get list of all sessions
	getStudySessions(user_email: string) {
		if (!this.test) {
			let queryParams = new HttpParams();
			queryParams = queryParams.append('user_id', user_email);
			return this.http.get<StudySession[]>(
				this.backend_url + '/get-sessions',
				{
					params: queryParams,
				}
			);
		} else {
			return this.http.get<StudySession[]>('/assets/sessions.json');
		}
	}

	// get details of a specific session with notes
	getStudySessionNotes(user_email: string, session_id: string) {
		if (!this.test) {
			let queryParams = new HttpParams();
			queryParams = queryParams.append('user_id', user_email);
			queryParams = queryParams.append('session_id', session_id);
			return this.http.get<StudySessionDetail>(
				this.backend_url + '/get-session',
				{
					params: queryParams,
				}
			);
		} else {
			return this.http.get<StudySessionDetail>('/assets/notes.json');
		}
	}

	// get quiz questions & answers for a specific session
	getQuiz(user_email: string, session_id: string) {
		if (!this.test) {
			let queryParams = new HttpParams();
			queryParams = queryParams.append('user_id', user_email);
			queryParams = queryParams.append('session_id', session_id);
			return this.http.get<Quiz>(this.backend_url + '/questions', {
				params: queryParams,
			});
		} else {
			return this.http.get<Quiz>('/assets/quiz.json');
		}
	}

	// generate quiz questions & answers for a specific session
	generateQuiz(user_email: string, session_id: string) {
		if (!this.test) {
			return this.http.post<SuccessResponse>(
				this.backend_url + '/generate-questions',
				{
					user_id: user_email,
					session_id: session_id,
				}
			);
		} else {
			return {
				status: 'ok',
			};
		}
	}

	getFeedback(
		user_email: string,
		session_id: string,
		quiz_question: QuizQuestion,
		provided_attempt: string[]
	) {
		if (!this.test) {
			return this.http.post<Feedback>(this.backend_url + '/feedback', {
				user_id: user_email,
				session_id: session_id,
				question: quiz_question.question,
				reference_answer: quiz_question.answer,
				chosen_answer: provided_attempt,
				context: quiz_question.context,
				references: quiz_question.references,
			});
		} else {
			return this.http.get<Feedback>('/assets/feedback.json');
		}
	}

	getSpecificDashboardStats(user_email: string, session_id: string) {
		if (!this.test) {
			let queryParams = new HttpParams();
			queryParams = queryParams.append('user_id', user_email);
			queryParams = queryParams.append('session_id', session_id);
			return this.http.get<SessionStats>(
				this.backend_url + '/session-dashbard',
				{
					params: queryParams,
				}
			);
		} else {
			return this.http.get<SessionStats>('/assets/session_stats.json');
		}
	}

	getGeneralDashboardStats(user_email: string) {
		if (!this.test) {
			let queryParams = new HttpParams();
			queryParams = queryParams.append('user_id', user_email);
			return this.http.get<GlobalStats>(
				this.backend_url + '/global-dashboard',
				{
					params: queryParams,
				}
			);
		} else {
			return this.http.get<GlobalStats>('/assets/session_stats.json');
		}
	}
}
