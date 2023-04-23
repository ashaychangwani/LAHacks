import { Component, OnInit } from '@angular/core';
import { ParticlesConfig } from '../../particles-config';

declare let particlesJS: any;

@Component({
	selector: 'app-landing-page',
	templateUrl: './landing-page.component.html',
	styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit {
	public ngOnInit(): void {
		this.invokeParticles();
	}

	public invokeParticles(): void {
		particlesJS('particles-js', ParticlesConfig, function () {});
	}
}
