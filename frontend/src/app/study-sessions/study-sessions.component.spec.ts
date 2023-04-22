import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudySessionsComponent } from './study-sessions.component';

describe('StudySessionsComponent', () => {
  let component: StudySessionsComponent;
  let fixture: ComponentFixture<StudySessionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudySessionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudySessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
