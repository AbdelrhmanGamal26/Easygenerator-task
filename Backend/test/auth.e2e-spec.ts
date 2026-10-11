import {
  ConflictException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { AuthAuditService } from '../src/auth/audit/auth-audit.service.js';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy.js';
import { JWT_AUDIENCE, JWT_ISSUER } from '../src/auth/tokens/jwt.constants.js';
import { RefreshTokensService } from '../src/auth/tokens/refresh-tokens.service.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { UsersController } from '../src/users/users.controller.js';
import { UsersService } from '../src/users/users.service.js';

const SECRET = 'test-secret-test-secret-test-secret-123';

class FakeUsersService {
  private users: any[] = [];
  async create(data: { email: string; name: string; password: string }) {
    if (this.users.some((u) => u.email === data.email.toLowerCase()))
      throw new ConflictException('Email is already registered');
    const user = {
      ...data,
      email: data.email.toLowerCase(),
      id: String(this.users.length + 1),
    };
    this.users.push(user);
    return user;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email.toLowerCase()) ?? null;
  }
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
}

class FakeRefreshTokensService {
  private tokens = new Map<string, { userId: string; used: boolean }>();
  private counter = 0;
  async issue(userId: string) {
    const token = `refresh-${++this.counter}`;
    this.tokens.set(token, { userId, used: false });
    return { token, expiresAt: new Date(Date.now() + 86_400_000) };
  }
  async rotate(token: string) {
    const entry = this.tokens.get(token);
    if (!entry || entry.used) throw new UnauthorizedException();
    entry.used = true;
    return { userId: entry.userId, ...(await this.issue(entry.userId)) };
  }
  async revoke(token: string) {
    const userId = this.tokens.get(token)?.userId ?? null;
    this.tokens.delete(token);
    return userId;
  }
  async revokeAll(token: string) {
    const userId = this.tokens.get(token)?.userId ?? null;
    for (const [t, e] of this.tokens)
      if (e.userId === userId) this.tokens.delete(t);
    return userId;
  }
}

const cookieValue = (res: request.Response, name: string) => {
  const raw = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
    c.startsWith(`${name}=`),
  );
  return raw!.split(';')[0];
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const body = {
    email: 'Jane@Example.com',
    name: 'Jane Doe',
    password: 'Passw0rd!',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: SECRET,
              COOKIE_SAME_SITE: 'lax',
            }),
          ],
        }),
        PassportModule,
        JwtModule.register({
          secret: SECRET,
          signOptions: {
            algorithm: 'HS256',
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: '1h',
          },
        }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: UsersService, useClass: FakeUsersService },
        { provide: RefreshTokensService, useClass: FakeRefreshTokensService },
        { provide: AuthAuditService, useValue: { record() {}, alert() {} } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(
      new AllExceptionsFilter({ error: () => undefined } as never),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /auth/signup rejects invalid payloads', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'bad', name: 'Jo', password: 'weak' })
      .expect(400);
    expect(res.body.message.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /auth/signup creates a user without starting a session', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(body)
      .expect(201);
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(res.body.user).toEqual({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
  });

  it('POST /auth/signup returns 409 for duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(body)
      .expect(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('POST /auth/signin rejects wrong credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: body.email, password: 'Wrong123!' })
      .expect(401);
  });

  it('protects GET /users/me and serves it with the cookie set on sign in', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);

    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: body.email, password: body.password })
      .expect(200);
    expect(signin.body).not.toHaveProperty('accessToken');
    const cookies = signin.headers['set-cookie'] as unknown as string[];
    const cookie = cookies.find((c) => c.startsWith('access_token='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='))!;
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/auth/);

    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
    expect(me.body.email).toBe('jane@example.com');
  });

  it('POST /auth/refresh rotates the refresh token and rejects reuse', async () => {
    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: body.email, password: body.password })
      .expect(200);
    const oldRefresh = cookieValue(signin, 'refresh_token');

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldRefresh)
      .expect(200);
    expect(refreshed.body.user.email).toBe('jane@example.com');
    expect(cookieValue(refreshed, 'refresh_token')).not.toBe(oldRefresh);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', cookieValue(refreshed, 'access_token'))
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldRefresh)
      .expect(401);
  });

  it('POST /auth/refresh requires a refresh cookie', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('POST /auth/signout revokes the refresh token and clears both cookies', async () => {
    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: body.email, password: body.password })
      .expect(200);
    const refresh = cookieValue(signin, 'refresh_token');

    const res = await request(app.getHttpServer())
      .post('/auth/signout')
      .set('Cookie', refresh)
      .expect(204);
    const cleared = (res.headers['set-cookie'] as unknown as string[]).join(
      ';',
    );
    expect(cleared).toMatch(/access_token=;/);
    expect(cleared).toMatch(/refresh_token=;/);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refresh)
      .expect(401);
  });

  it('POST /auth/signout-all invalidates the other sessions too', async () => {
    const login = () =>
      request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: body.email, password: body.password })
        .expect(200);
    const deviceA = cookieValue(await login(), 'refresh_token');
    const deviceB = cookieValue(await login(), 'refresh_token');

    await request(app.getHttpServer())
      .post('/auth/signout-all')
      .set('Cookie', deviceA)
      .expect(204);

    for (const cookie of [deviceA, deviceB]) {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    }
  });

  it('rejects tokens with a foreign issuer', async () => {
    const forged = await app
      .get(JwtService)
      .signAsync({ sub: '1', email: body.email }, { issuer: 'someone-else' });
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', `access_token=${forged}`)
      .expect(401);
  });
});
