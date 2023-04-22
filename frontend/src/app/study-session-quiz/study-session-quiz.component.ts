import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { AuthService } from '@auth0/auth0-angular';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { StudySessionDetail } from '../interfaces';

@Component({
  selector: 'app-study-session-quiz',
  templateUrl: './study-session-quiz.component.html',
  styleUrls: ['./study-session-quiz.component.css'],
})
export class StudySessionQuizComponent implements OnInit {
  userEmail: string = '';
  studySessionDetail!: Observable<StudySessionDetail>;

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

        this.studySessionDetail = this.userService.getStudySessionNotes(
          this.userEmail,
          sessionId
        );
        
      }
    });
  }
}
