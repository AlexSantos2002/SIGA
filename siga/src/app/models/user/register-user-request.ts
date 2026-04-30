export interface RegisterUserRequest {
  name: string,
  email: string,
  password: string
  role: 'admin' | 'user',
  organizationId: string
}
