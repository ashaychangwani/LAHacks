import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { AuthService } from '@auth0/auth0-angular';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Note } from '../interfaces';

@Component({
  selector: 'app-study-session-notes',
  templateUrl: './study-session-notes.component.html',
  styleUrls: ['./study-session-notes.component.css'],
})
export class StudySessionNotesComponent implements OnInit {
  userEmail: string = '';
  studyNotes!: Observable<Note[]>;

  constructor(
    private userService: UserService,
    public auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
      const routeParams = this.route.snapshot.paramMap;
      const sessionId = routeParams.get('session-id');
      if (user && sessionId) {
        this.userEmail = user.email ? user.email : '';
        this.studyNotes = this.userService.getStudySessionNotes(
          this.userEmail,
          sessionId
        );
      }
    });
  }
}
