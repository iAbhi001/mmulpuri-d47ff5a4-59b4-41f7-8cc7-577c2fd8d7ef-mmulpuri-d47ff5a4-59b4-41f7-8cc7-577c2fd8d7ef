import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthActions } from '../store/auth.actions';
import { selectAuthLoading, selectAuthError, selectOrgInviteCode } from '../store/auth.selectors';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center transition-colors duration-300 py-8"
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold" [class.text-white]="isDark" [class.text-gray-900]="!isDark">
            Create Account
          </h1>
          <p class="mt-1 text-sm" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
            Join TaskFlow
          </p>
        </div>

        <!-- Owner invite code banner -->
        <div *ngIf="orgInviteCode$ | async as code"
             class="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200">
          <p class="font-bold text-green-800 mb-1">🎉 Organization created!</p>
          <p class="text-sm text-green-700 mb-2">
            Share this invite code with people you want as <strong>Admins</strong>:
          </p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-center text-xl font-mono font-bold tracking-widest
                         bg-white border border-green-300 rounded-xl py-2 px-4 text-green-800">
              {{ code }}
            </code>
            <button (click)="copyCode(code)"
                    class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs
                           font-semibold rounded-xl transition-colors">
              {{ copied ? '✓ Copied' : 'Copy' }}
            </button>
          </div>
          <p class="text-xs text-green-600 mt-2">Save this code — it won't be shown again.</p>
        </div>

        <div class="rounded-2xl shadow-xl p-8 transition-colors"
             [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">

          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <div *ngIf="error$ | async as error"
                 class="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm flex items-center gap-2">
              <span>⚠️</span> {{ error }}
            </div>

            <!-- First / Last Name -->
            <div class="flex gap-3 mb-4">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1.5"
                       [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">First Name</label>
                <input formControlName="firstName" type="text" placeholder="John"
                  class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                  [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                  [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                  [class.border-red-500]="form.get('firstName')?.touched && form.get('firstName')?.invalid"/>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1.5"
                       [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">Last Name</label>
                <input formControlName="lastName" type="text" placeholder="Doe"
                  class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                  [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                  [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                  [class.border-red-500]="form.get('lastName')?.touched && form.get('lastName')?.invalid"/>
              </div>
            </div>

            <!-- Email -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1.5"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">Email Address</label>
              <input formControlName="email" type="email" placeholder="you@example.com"
                class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                [class.border-red-500]="form.get('email')?.touched && form.get('email')?.invalid"/>
              <p *ngIf="form.get('email')?.touched && form.get('email')?.invalid"
                 class="mt-1 text-xs text-red-500">Please enter a valid email</p>
            </div>

            <!-- Password -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1.5"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">Password</label>
              <div class="relative">
                <input formControlName="password" [type]="showPassword ? 'text' : 'password'"
                  placeholder="Min. 8 characters"
                  class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all pr-12"
                  [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                  [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                  [class.border-red-500]="form.get('password')?.touched && form.get('password')?.invalid"/>
                <button type="button" (click)="showPassword = !showPassword"
                        class="absolute right-3 top-3.5 text-sm"
                        [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
                  {{ showPassword ? '👁️' : '🙈' }}
                </button>
              </div>
              <p *ngIf="form.get('password')?.touched && form.get('password')?.invalid"
                 class="mt-1 text-xs text-red-500">Password must be at least 8 characters</p>
            </div>

            <!-- Invite Code -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1.5"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">
                Invite / Access Code
                <span class="font-normal opacity-60 ml-1">(optional for viewers)</span>
              </label>
              <input formControlName="inviteCode" type="text"
                placeholder="1001 for Owner, or org code for Admin"
                class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all font-mono tracking-wider"
                [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"/>
              <div class="mt-2">
                <span *ngIf="detectedRole === 'owner'"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  👑 Owner — you'll create a new organization
                </span>
                <span *ngIf="detectedRole === 'admin'"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  🛡️ Admin — you'll join an existing organization
                </span>
                <span *ngIf="detectedRole === 'viewer'"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  👤 Viewer — select an organization below
                </span>
              </div>
            </div>

            <!-- Organization Name (Owner only) -->
            <div *ngIf="detectedRole === 'owner'" class="mb-4">
              <label class="block text-sm font-medium mb-1.5"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">
                Organization Name <span class="text-red-500">*</span>
              </label>
              <input formControlName="organizationName" type="text" placeholder="e.g. Acme Corp"
                class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"/>
              <p class="mt-1 text-xs text-indigo-400">After signup, you'll receive an invite code to share with admins.</p>
            </div>

            <!-- Organization picker (Viewer only) -->
            <div *ngIf="detectedRole === 'viewer'" class="mb-4">
              <label class="block text-sm font-medium mb-1.5"
                     [class.text-gray-300]="isDark" [class.text-gray-700]="!isDark">
                Select Organization <span class="text-red-500">*</span>
              </label>
              <select formControlName="organizationId"
                class="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                [class.bg-white]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark">
                <option value="">-- Select an organization --</option>
                <option *ngFor="let org of organizations" [value]="org._id || org.id">
                  {{ org.name }}
                </option>
              </select>
            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="loading$ | async"
              class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                     text-white font-semibold rounded-xl transition-all duration-200
                     flex items-center justify-center gap-2 mt-2">
              <svg *ngIf="loading$ | async" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ (loading$ | async) ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
            Already have an account?
            <a routerLink="/login" class="text-indigo-500 hover:text-indigo-400 font-semibold ml-1">Sign in</a>
          </p>
        </div>

        <!-- Role guide -->
        <div class="mt-4 rounded-xl p-4 text-xs space-y-1.5"
             [class.bg-gray-800]="isDark" [class.text-gray-400]="isDark"
             [class.bg-gray-100]="!isDark" [class.text-gray-600]="!isDark">
          <p class="font-semibold mb-1" [class.text-gray-200]="isDark" [class.text-gray-700]="!isDark">How roles work:</p>
          <p>👑 <strong>Owner</strong> — enter code <code class="font-mono bg-purple-100 text-purple-700 px-1 rounded">1001</code> to create a new organization</p>
          <p>🛡️ <strong>Admin</strong> — enter your organization's invite code (given by the Owner)</p>
          <p>👤 <strong>Viewer</strong> — leave blank and select your organization from the list</p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private themeService = inject(ThemeService);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    inviteCode: [''],
    organizationName: [''],
    organizationId: [''],
  });

  showPassword = false;
  copied = false;
  organizations: any[] = [];
  loading$: Observable<boolean> = this.store.select(selectAuthLoading);
  error$: Observable<string | null> = this.store.select(selectAuthError);
  orgInviteCode$: Observable<string | null> = this.store.select(selectOrgInviteCode);

  get isDark() { return this.themeService.isDark(); }

  get detectedRole(): 'owner' | 'admin' | 'viewer' {
    const code = this.form.get('inviteCode')?.value?.trim() ?? '';
    if (code === '1001') return 'owner';
    if (code.length > 0) return 'admin';
    return 'viewer';
  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/organizations`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (orgs) => (this.organizations = orgs), error: () => {} });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { firstName, lastName, email, password, inviteCode, organizationName, organizationId } = this.form.value;
    this.store.dispatch(AuthActions.register({
      dto: {
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        password: password!,
        inviteCode: inviteCode?.trim() || undefined,
        organizationName: organizationName?.trim() || undefined,
        organizationId: organizationId || undefined,
      },
    }));
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  toggleTheme() { this.themeService.toggle(); }
}
