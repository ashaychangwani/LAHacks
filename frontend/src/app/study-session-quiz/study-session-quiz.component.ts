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
	styleUrls: ['./study-session-quiz.component.scss'],
})
export class StudySessionQuizComponent implements OnInit {
	userEmail: string = '';
	sessionId: string | null = '';
	studySessionDetail!: Observable<StudySessionDetail>;
	quiz!: Observable<Quiz>;
	feedback: string[] = [];
	formGroup: FormGroup;
	explanation = '';

	constructor(
		private userService: UserService,
		public auth: AuthService,
		private route: ActivatedRoute,
		private fb: FormBuilder
	) {
		this.formGroup = this.fb.group({
			checkArray: this.fb.array([], [Validators.required]),
		});
	}

	ngOnInit() {
		this.auth.user$.subscribe((user) => {
			const routeParams = this.route.snapshot.paramMap;
			this.sessionId = routeParams.get('session-id');
			if (user && this.sessionId) {
				this.userEmail = user.email ? user.email : '';

				this.studySessionDetail = this.userService.getStudySessionNotes(
					this.userEmail,
					this.sessionId
				);

				this.quiz = this.userService.getQuiz(
					this.userEmail,
					this.sessionId
				);

				this.quiz.subscribe((quiz) => {
					quiz.questions.forEach((question, index) => {
						this.formGroup.addControl(
							'control_' + index,
							new FormControl('')
						);
					});
				});
			}
		});
	}

	getFeedback(index: number) {
		this.quiz.subscribe((quiz) => {
			quiz.questions.forEach((question, i) => {
				if (index == i) {
					if (this.formGroup.get('control_' + i) && this.sessionId) {
						const control = this.formGroup.controls['control_' + i];
						this.feedback = [];
						let attempted_answer = [];
						if (question.question_type == 'MultipleAnswer') {
							attempted_answer = [control.value];
						} else {
							attempted_answer =
								this.formGroup.controls['checkArray'].value;
						}
						this.userService
							.getFeedback(
								this.userEmail,
								this.sessionId,
								question,
								attempted_answer
							)
							.subscribe((feedback) => {
								this.feedback[i] = feedback;
							});
					}
				}
			});
		});
	}

	// }
	onCheckboxChange(e: any) {
		const checkArray: FormArray = this.formGroup.get(
			'checkArray'
		) as FormArray;
		if (e.target.checked) {
			checkArray.push(new FormControl(e.target.value));
		} else {
			let i: number = 0;
			checkArray.controls.forEach((item: any) => {
				if (item.value == e.target.value) {
					checkArray.removeAt(i);
					return;
				}
				i++;
			});
		}
	}
}
