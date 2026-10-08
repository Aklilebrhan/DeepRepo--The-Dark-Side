/**
 * Authentication module for sample repository
 */

export interface UserSession {
  userId: string;
  roles: string[];
  expiresAt: number;
}

export class AuthenticationManager {
  private sessions: Map<string, UserSession> = new Map();

  public createSession(userId: string, roles: string[] = ['user']): string {
    const token = `sess_${Date.now()}_${userId}`;
    this.sessions.set(token, {
      userId,
      roles,
      expiresAt: Date.now() + 3600 * 1000,
    });
    return token;
  }

  public validateSession(token: string): boolean {
    const session = this.sessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return false;
    }
    return true;
  }

  public revokeSession(token: string): void {
    this.sessions.delete(token);
  }
}
