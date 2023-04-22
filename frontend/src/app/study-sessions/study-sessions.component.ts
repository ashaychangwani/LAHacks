import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { StudySession } from '../interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-study-sessions',
  templateUrl: './study-sessions.component.html',
  styleUrls: ['./study-sessions.component.css'],
})
export class StudySessionsComponent {
  studySessions!: Observable<StudySession[]>;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.studySessions = this.userService.getStudySessions();
  }
}
