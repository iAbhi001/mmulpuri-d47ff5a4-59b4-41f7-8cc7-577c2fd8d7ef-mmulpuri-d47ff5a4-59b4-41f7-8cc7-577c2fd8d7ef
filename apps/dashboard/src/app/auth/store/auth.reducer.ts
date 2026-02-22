import { createReducer, on } from '@ngrx/store';
import { IUser } from '@mmulpuri/data';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: Omit<IUser, 'organization'> | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  orgInviteCode: string | null;
}

const initialState: AuthState = {
  user: (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem('access_token'),
  loading: false,
  error: null,
  orgInviteCode: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { response }) => {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return {
      ...state,
      user: response.user,
      token: response.accessToken,
      loading: false,
      error: null,
      orgInviteCode: null,
    };
  }),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.register, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.registerSuccess, (state, { response }) => {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return {
      ...state,
      user: response.user,
      token: response.accessToken,
      loading: false,
      error: null,
      orgInviteCode: response.orgInviteCode ?? null,
    };
  }),
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.logout, () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return { user: null, token: null, loading: false, error: null, orgInviteCode: null };
  }),
  on(AuthActions.loadUserFromStorage, (state) => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      return { ...state, user };
    } catch { return state; }
  }),
);
