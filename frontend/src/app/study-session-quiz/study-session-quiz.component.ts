import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { AuthService } from '@auth0/auth0-angular';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Quiz, StudySessionDetail } from '../interfaces';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-study-session-quiz',
  templateUrl: './study-session-quiz.component.html',
  styleUrls: ['./study-session-quiz.component.css'],
})
export class StudySessionQuizComponent implements OnInit {
  userEmail: string = '';
  studySessionDetail!: Observable<StudySessionDetail>;
  quiz!: Observable<Quiz[]>;
  form: FormGroup;
  explanation = '';

  constructor(
    private userService: UserService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      checkArray: this.fb.array([], [Validators.required]),
    });
  }

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

        // this.quiz = this.userService.getQuiz(this.userEmail, sessionId);
      }
    });
  }

//   onCheckboxChange(e: any) {
//     const checkArray: FormArray = this.form.get('checkArray') as FormArray;
//     if (e.target.checked) {
//       checkArray.push(new FormControl(e.target.value));
//     } else {
//       let i: number = 0;
//       checkArray.controls.forEach((item: any) => {
//         if (item.value == e.target.value) {
//           checkArray.removeAt(i);
//           return;
//         }
//         i++;
//       });
//     }
//   }

//   submitForm(question_id: number) {
//     let provided_attempt = this.form.value;

//     this.quiz.subscribe((challenges) => {
//       challenges.forEach((challenge, index) => {
//         if (index == question_id) {
//           if (challenge.question_type == 'MultipleAnswer') {
//           } else if (challenge.question_type == 'MultipleChoice') {
//           } else if (challenge.question_type == 'ShortAnswer') {
//           }
//         }
//       });
//     });
//   }
}
