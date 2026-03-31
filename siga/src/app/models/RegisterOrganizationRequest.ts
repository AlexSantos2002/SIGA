export interface RegisterOrganizationRequest {
  // Dados da organizacao
  name: string,
  email: string,
  phone: string,
  address: string,

  // Dados do administrador
  adminName: string,
  adminEmail: string,
  adminPassword: string
}
