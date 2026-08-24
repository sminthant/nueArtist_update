import { HttpException, Injectable } from '@nestjs/common';

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
}

@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, RateLimitEntry>();
  private readonly maxAttempts = 5;
  private readonly lockDurationMs = 60_000;

  private buildKey(email: string, ip: string): string {
    return `${email.toLowerCase()}|${ip}`;
  }

  ensureNotRateLimited(email: string, ip: string): void {
    const key = this.buildKey(email, ip);
    const entry = this.attempts.get(key);

    if (!entry?.lockedUntil) {
      return;
    }

    const now = Date.now();

    if (entry.lockedUntil <= now) {
      this.attempts.delete(key);

      return;
    }

    const seconds = Math.ceil((entry.lockedUntil - now) / 1000);

    throw new HttpException(
      {
        message: 'The given data was invalid.',
        errors: {
          email: [
            `Too many login attempts. Please try again in ${seconds} seconds.`,
          ],
        },
      },
      422,
    );
  }

  recordFailedAttempt(email: string, ip: string): void {
    const key = this.buildKey(email, ip);
    const entry = this.attempts.get(key) ?? { attempts: 0, lockedUntil: null };

    entry.attempts += 1;

    if (entry.attempts >= this.maxAttempts) {
      entry.lockedUntil = Date.now() + this.lockDurationMs;
    }

    this.attempts.set(key, entry);
  }

  clearAttempts(email: string, ip: string): void {
    this.attempts.delete(this.buildKey(email, ip));
  }
}
