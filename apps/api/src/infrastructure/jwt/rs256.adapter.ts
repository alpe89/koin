import jwt from 'jsonwebtoken'
import type { JwtPayload, JwtService } from './jwt.port.ts'

const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

export class Rs256JwtAdapter implements JwtService {
  private readonly privateKey: string
  private readonly publicKey: string

  constructor(privateKey: string, publicKey: string) {
    this.privateKey = privateKey
    this.publicKey = publicKey
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: JWT_EXPIRY_SECONDS,
    })
  }

  verify(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.publicKey, { algorithms: ['RS256'] })
    if (typeof decoded === 'string') {
      throw new Error('Invalid JWT payload')
    }
    const { sub, email, displayName } = decoded as Record<string, unknown>
    if (
      typeof sub !== 'string' ||
      typeof email !== 'string' ||
      typeof displayName !== 'string'
    ) {
      throw new Error('JWT payload missing required fields')
    }
    return { sub, email, displayName }
  }
}
