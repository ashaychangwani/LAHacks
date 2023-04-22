import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { StudySession, StudySessionDetail } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getStudySessions(user_email: string) {
    // let queryParams = new HttpParams();
    // queryParams = queryParams.append("user_id", user_email);
    // return this.http.get<StudySession[]>(
    //   '/get-sessions',
    //   {params:queryParams}
    // );
    return this.http.get<StudySession[]>('/assets/sessions.json');
  }

  getStudySessionNotes(user_email: string, session_id: string) {
    // let queryParams = new HttpParams();
    // queryParams = queryParams.append("user_id", user_email);
    // queryParams = queryParams.append("session_id", userEmail);
    // return this.http.get<StudySessionDetail>(
    //   '/get-session',
    //   {params:queryParams}
    // );
    return this.http.get<StudySessionDetail>('/assets/notes.json');
  }
}
