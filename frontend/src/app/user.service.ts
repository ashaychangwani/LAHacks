import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StudySession } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getStudySessions() {
    return this.http.get<StudySession[]>(
      '/assets/sessions.json'
    );
  }
}
