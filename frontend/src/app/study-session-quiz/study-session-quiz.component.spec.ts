import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudySessionQuizComponent } from './study-session-quiz.component';

describe('StudySessionQuizComponent', () => {
  let component: StudySessionQuizComponent;
  let fixture: ComponentFixture<StudySessionQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudySessionQuizComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudySessionQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
