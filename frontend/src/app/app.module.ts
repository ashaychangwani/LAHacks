import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from '@auth0/auth0-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { YouTubePlayerModule } from '@angular/youtube-player';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { StudySessionsComponent } from './study-sessions/study-sessions.component';
import { StudySessionNotesComponent } from './study-session-notes/study-session-notes.component';
import { StudySessionQuizComponent } from './study-session-quiz/study-session-quiz.component';
import { StudySessionStatsComponent } from './study-session-stats/study-session-stats.component';

import { environment } from 'src/environments/environment';
import { LandingPageComponent } from './landing-page/landing-page.component';

@NgModule({
	declarations: [
		AppComponent,
		HeaderComponent,
		StudySessionsComponent,
		StudySessionNotesComponent,
		StudySessionQuizComponent,
		StudySessionStatsComponent,
  LandingPageComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		NgbModule,
		HttpClientModule,
		ReactiveFormsModule,
        YouTubePlayerModule,
		AuthModule.forRoot({
			domain: environment.auth0.domain,
			clientId: environment.auth0.clientId,
			authorizationParams: {
				redirect_uri: window.location.origin,
			},
		}),
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
