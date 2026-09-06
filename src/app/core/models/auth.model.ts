export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  fullName: string;
  email: string;
  token: string;
  refreshToken: string;
  tokenExpiration: string;
  roles: string[];
  permissions: string[];
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: number;
  createdAt: string;
  roles: string[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateUserRequest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface AssignRoleRequest {
  userId: number;
  roleId: number;
}

export interface AssignPermissionRequest {
  userId: number;
  permissionId: number;
}

export interface RoleResponse {
  id: number;
  name: string;
  description: string;
  status: number;
  createdAt: string;
}

export interface PermissionResponse {
  id: number;
  module: string;
  action: string;
  description: string;
  status: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  id: number;
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface CreatePermissionRequest {
  module: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  id: number;
  module: string;
  action: string;
  description?: string;
}
