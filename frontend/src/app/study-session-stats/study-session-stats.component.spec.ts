import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudySessionStatsComponent } from './study-session-stats.component';

describe('StudySessionStatsComponent', () => {
  let component: StudySessionStatsComponent;
  let fixture: ComponentFixture<StudySessionStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudySessionStatsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudySessionStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
