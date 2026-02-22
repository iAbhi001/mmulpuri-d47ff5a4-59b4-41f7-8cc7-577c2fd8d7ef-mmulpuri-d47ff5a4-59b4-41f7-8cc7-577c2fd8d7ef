import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginDto, AuthResponse, RegisterDto } from '@mmulpuri/data';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credentials: LoginDto }>(),
    'Login Success': props<{ response: AuthResponse }>(),
    'Login Failure': props<{ error: string }>(),
    Register: props<{ dto: RegisterDto }>(),
    'Register Success': props<{ response: AuthResponse }>(),
    'Register Failure': props<{ error: string }>(),
    Logout: emptyProps(),
    'Load User From Storage': emptyProps(),
  },
});
