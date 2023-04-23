import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { StudySession } from '../interfaces';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-study-sessions',
  templateUrl: './study-sessions.component.html',
  styleUrls: ['./study-sessions.component.scss'],
})
export class StudySessionsComponent implements OnInit {
  studySessions!: Observable<StudySession[]>;
  userEmail: string = '';

  constructor(private userService: UserService, public auth: AuthService) {}

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
        if(user) {
            this.userEmail = user.email? user.email : '';
            this.studySessions = this.userService.getStudySessions(this.userEmail);
        }
    });
    
  }
}