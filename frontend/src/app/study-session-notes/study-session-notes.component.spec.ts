import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudySessionNotesComponent } from './study-session-notes.component';

describe('StudySessionNotesComponent', () => {
  let component: StudySessionNotesComponent;
  let fixture: ComponentFixture<StudySessionNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudySessionNotesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudySessionNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
