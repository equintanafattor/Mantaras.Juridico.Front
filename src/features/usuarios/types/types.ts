export type RolUsuario = "Administrador" | "Usuario";

export type UsuarioResponse = {
  usuarioId: number;
  nombre: string;
  email: string;
  roles: RolUsuario[];
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
};

export type CrearUsuarioRequest = {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
};
