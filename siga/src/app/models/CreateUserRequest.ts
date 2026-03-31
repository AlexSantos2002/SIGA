export interface CreateUserRequest {
  name: string,
  email: string,
  password: string
  role: 'admin' | 'user',
  organizationId: string
}
