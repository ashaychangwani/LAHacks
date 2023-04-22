import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudySessionsComponent } from './study-sessions/study-sessions.component';
import { StudySessionNotesComponent } from './study-session-notes/study-session-notes.component';
import { StudySessionQuizComponent } from './study-session-quiz/study-session-quiz.component';
import { StudySessionStatsComponent } from './study-session-stats/study-session-stats.component';
import { AuthGuard } from '@auth0/auth0-angular';

const routes: Routes = [
  { path: '', redirectTo: '/study-sessions', pathMatch: 'full' },
  {
    path: 'study-sessions',
    component: StudySessionsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'study-session-notes/:session-id',
    component: StudySessionNotesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'study-session-quiz/:session-id',
    component: StudySessionQuizComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'study-session-stats/:session-id',
    component: StudySessionStatsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
