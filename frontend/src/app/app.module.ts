import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StudySessionsComponent } from './study-sessions/study-sessions.component';
import { StudySessionNotesComponent } from './study-session-notes/study-session-notes.component';
import { StudySessionQuizComponent } from './study-session-quiz/study-session-quiz.component';
import { StudySessionStatsComponent } from './study-session-stats/study-session-stats.component';

@NgModule({
  declarations: [AppComponent, HeaderComponent, StudySessionsComponent, StudySessionNotesComponent, StudySessionQuizComponent, StudySessionStatsComponent],
  imports: [BrowserModule, AppRoutingModule, NgbModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
