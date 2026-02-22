import { authReducer, AuthState } from '../store/auth.reducer';
import { AuthActions } from '../store/auth.actions';
import { RoleType } from '@mmulpuri/data';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  orgInviteCode: null,
};

const mockAuthResponse = {
  accessToken: 'test-token',
  user: {
    id: 'user-1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: RoleType.VIEWER,
    organizationId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe('Auth Reducer', () => {
  beforeEach(() => localStorageMock.clear());

  it('should return initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' } as any);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set loading on Login action', () => {
    const state = authReducer(
      initialState,
      AuthActions.login({ credentials: { email: 'a@b.com', password: 'pass' } })
    );
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set user and token on Login Success', () => {
    const state = authReducer(
      initialState,
      AuthActions.loginSuccess({ response: mockAuthResponse })
    );
    expect(state.user).toEqual(mockAuthResponse.user);
    expect(state.token).toBe('test-token');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should persist token to localStorage on Login Success', () => {
    authReducer(initialState, AuthActions.loginSuccess({ response: mockAuthResponse }));
    expect(localStorageMock.getItem('access_token')).toBe('test-token');
  });

  it('should set error on Login Failure', () => {
    const state = authReducer(
      { ...initialState, loading: true },
      AuthActions.loginFailure({ error: 'Invalid credentials' })
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
    expect(state.user).toBeNull();
  });

  it('should clear user and token on Logout', () => {
    const loggedInState: AuthState = {
      user: mockAuthResponse.user,
      token: 'test-token',
      loading: false,
      error: null,
      orgInviteCode: null,
    };
    const state = authReducer(loggedInState, AuthActions.logout());
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should remove token from localStorage on Logout', () => {
    localStorageMock.setItem('access_token', 'test-token');
    authReducer({ ...initialState, token: 'test-token' }, AuthActions.logout());
    expect(localStorageMock.getItem('access_token')).toBeNull();
  });

  it('should store orgInviteCode on Register Success (owner signup)', () => {
    const ownerResponse = { ...mockAuthResponse, orgInviteCode: 'ABC123' };
    const state = authReducer(
      initialState,
      AuthActions.registerSuccess({ response: ownerResponse })
    );
    expect(state.orgInviteCode).toBe('ABC123');
    expect(state.token).toBe('test-token');
  });

  it('should clear orgInviteCode on Logout', () => {
    const state = authReducer(
      { ...initialState, orgInviteCode: 'ABC123' },
      AuthActions.logout()
    );
    expect(state.orgInviteCode).toBeNull();
  });
});
