export type IniciarSesionRequest = {
  email: string;
  password: string;
};

export type UsuarioAutenticado = {
  usuarioId: number;
  nombre: string;
  email: string;
  roles: string[];
};

export type IniciarSesionResponse = {
  accessToken: string;
  expiraEnUtc: string;
  usuario: UsuarioAutenticado;
};

export type AuthSession = IniciarSesionResponse;