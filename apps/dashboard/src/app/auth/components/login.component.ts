import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthActions } from '../store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../store/auth.selectors';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center transition-colors duration-300"
         [class.bg-gray-900]="isDark" [class.bg-gray-50]="!isDark">

      <button (click)="toggleTheme()"
        class="fixed top-4 right-4 p-2 rounded-full transition-colors z-50"
        [class.bg-gray-700]="isDark" [class.text-yellow-400]="isDark"
        [class.bg-gray-200]="!isDark" [class.text-gray-700]="!isDark"
        aria-label="Toggle theme">
        {{ isDark ? '☀️' : '🌙' }}
      </button>

      <div class="w-full max-w-md mx-4">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-indigo-600">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold" [class.text-white]="isDark" [class.text-gray-900]="!isDark">
            TaskFlow
          </h1>
          <p class="mt-1 text-sm" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
            Sign in to manage your tasks
          </p>
        </div>

        <div class="rounded-2xl shadow-xl p-8 transition-colors"
             [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <div *ngIf="error$ | async as error"
                 class="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
              ⚠️ {{ error }}
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">
                Email
              </label>
              <input type="email" formControlName="email"
                class="w-full px-3 py-2 rounded-lg border text-sm transition-colors"
                [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                placeholder="you@example.com" />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-1"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">
                Password
              </label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" formControlName="password"
                  class="w-full px-3 py-2 rounded-lg border text-sm pr-10 transition-colors"
                  [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                  [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                  placeholder="••••••••" />
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-sm">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="form.invalid || (loading$ | async)"
              class="w-full py-2.5 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span *ngIf="loading$ | async">Signing in...</span>
              <span *ngIf="!(loading$ | async)">Sign In</span>
            </button>

          </form>

          <div class="mt-6 text-center">
            <p class="text-sm" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
              Don't have an account?
              <a routerLink="/register" class="text-indigo-400 hover:text-indigo-300 font-medium ml-1">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  showPassword = false;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  get isDark() { return this.themeService.isDark(); }

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private themeService: ThemeService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.store.dispatch(AuthActions.login({ credentials: this.form.value }));
  }

  toggleTheme() { this.themeService.toggle(); }
}
