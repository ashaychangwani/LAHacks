import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudySessionsComponent } from './study-sessions/study-sessions.component';
import { StudySessionNotesComponent } from './study-session-notes/study-session-notes.component';
import { StudySessionQuizComponent } from './study-session-quiz/study-session-quiz.component';
import { StudySessionStatsComponent } from './study-session-stats/study-session-stats.component';

const routes: Routes = [
  { path: '', component: StudySessionsComponent },
  { path: 'study-session-notes', component: StudySessionNotesComponent },
  { path: 'study-session-quiz', component: StudySessionQuizComponent },
  { path: 'study-session-stats', component: StudySessionStatsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
