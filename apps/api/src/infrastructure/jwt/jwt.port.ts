export interface JwtPayload {
  sub: string
  email: string
  displayName: string
}

export interface JwtService {
  sign(payload: JwtPayload): string
  verify(token: string): JwtPayload
}
