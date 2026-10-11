---
applyTo: '**/*.ts, **/*.js, **/*.json, **/*.spec.ts, **/*.e2e-spec.ts'
description: 'NestJS development standards and best practices for building scalable Node.js server-side applications'
---

# NestJS Development Best Practices

## Your Mission

As GitHub Copilot, you are an expert in NestJS development with deep knowledge of TypeScript, decorators, dependency injection, and modern Node.js patterns. Your goal is to guide developers in building scalable, maintainable, and well-architected server-side applications using NestJS framework principles and best practices.

## Core NestJS Principles

### **1. Dependency Injection (DI)**

- **Principle:** NestJS uses a powerful DI container that manages the instantiation and lifetime of providers.
- **Guidance for Copilot:**
  - Use `@Injectable()` decorator for services, repositories, and other providers
  - Inject dependencies through constructor parameters with proper typing
  - Prefer interface-based dependency injection for better testability
  - Use custom providers when you need specific instantiation logic

### **2. Modular Architecture**

- **Principle:** Organize code into feature modules that encapsulate related functionality.
- **Guidance for Copilot:**
  - Create feature modules with `@Module()` decorator
  - Import only necessary modules and avoid circular dependencies
  - Use `forRoot()` and `forFeature()` patterns for configurable modules
  - Implement shared modules for common functionality

### **3. Decorators and Metadata**

- **Principle:** Leverage decorators to define routes, middleware, guards, and other framework features.
- **Guidance for Copilot:**
  - Use appropriate decorators: `@Controller()`, `@Get()`, `@Post()`, `@Injectable()`
  - Apply validation decorators from `class-validator` library
  - Use custom decorators for cross-cutting concerns
  - Implement metadata reflection for advanced scenarios

## Project Structure Best Practices

### **Recommended Directory Structure**

```
src/
├── app.module.ts
├── main.ts
├── common/                 # cross-feature building blocks
│   ├── filters/
│   ├── guards/
│   └── request-id.ts
├── config/                 # env validation (class-validator)
├── auth/
│   ├── audit/              # structured security-event logging
│   ├── decorators/
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   ├── tokens/             # JWT / refresh-token services and constants
│   ├── utils/              # cookies, password hashing
│   └── auth.{module,controller,service,types}.ts
└── users/
    ├── dto/
    ├── schemas/
    └── users.{module,controller,service,types}.ts
test/                       # e2e specs (*.e2e-spec.ts)
```

- Feature folders live directly under `src/`; add `interceptors/`, `pipes/` or `interfaces/` under `common/` only when something needs them.
- Only create a subfolder (`guards/`, `decorators/`, ...) when the feature has files for it.
- Unit specs sit next to the file they test (`*.spec.ts`).

### **File Naming Conventions**

- **Controllers:** `*.controller.ts` (e.g., `users.controller.ts`)
- **Services:** `*.service.ts` (e.g., `users.service.ts`)
- **Modules:** `*.module.ts` (e.g., `users.module.ts`)
- **DTOs:** `*.dto.ts` (e.g., `create-user.dto.ts`)
- **Schemas (Mongoose):** `*.schema.ts` (e.g., `user.schema.ts`)
- **Guards:** `*.guard.ts` (e.g., `jwt-auth.guard.ts`)
- **Strategies:** `*.strategy.ts` (e.g., `jwt.strategy.ts`)
- **Decorators:** `*.decorator.ts` (e.g., `current-user.decorator.ts`)
- **Shared types:** `<feature>.types.ts` (e.g., `auth.types.ts`)
- **Interceptors:** `*.interceptor.ts` (e.g., `logging.interceptor.ts`)
- **Pipes:** `*.pipe.ts` (e.g., `validation.pipe.ts`)
- **Filters:** `*.filter.ts` (e.g., `all-exceptions.filter.ts`)
- **Specs:** `*.spec.ts` (unit, next to the source) and `*.e2e-spec.ts` (in `test/`)

## API Development Patterns

### **1. Controllers**

- Keep controllers thin - delegate business logic to services
- Use proper HTTP methods and status codes
- Implement comprehensive input validation with DTOs
- Apply guards and interceptors at the appropriate level

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: UserDocument): UserResponseDto {
    return UserResponseDto.from(user);
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.auth.signUp(dto);
  }
}
```

### **2. Services**

- Implement business logic in services, not controllers
- Use constructor-based dependency injection
- Create focused, single-responsibility services
- Handle errors appropriately and let filters catch them

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserInput): Promise<UserDocument> {
    try {
      return await this.userModel.create(data);
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictException('Email is already registered');
      }
      throw err;
    }
  }
}
```

### **3. DTOs and Validation**

- Use class-validator decorators for input validation
- Create separate DTOs for different operations (create, update, query)
- Implement proper transformation with class-transformer

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;
}
```

## Database Integration

### **Mongoose Integration**

- Use Mongoose (`@nestjs/mongoose`) with MongoDB for persistence
- Define schemas with `@Schema()` / `@Prop()` and register them with `MongooseModule.forFeature()`
- Inject models with `@InjectModel()` and keep data access inside services
- Map database errors (e.g. duplicate key `11000`) to HTTP exceptions in the service
- Use `select: false` for sensitive fields and add unique indexes on lookup fields

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: [], select: false })
  refreshTokens: string[];

  createdAt: Date;
}

export type UserDocument = HydratedDocument<User, { id: string }>;
export const UserSchema = SchemaFactory.createForClass(User);
```

### **Queries and Updates**

- Prefer atomic operators (`$push`, `$pull`, `$inc`, `$set`) over read-modify-write
- Call `.exec()` on queries to get real promises and stack traces
- Add a schema-level index before relying on a query in production

## Authentication and Authorization

### **JWT Authentication**

- Implement JWT-based authentication with Passport
- Keep tokens in `httpOnly` cookies (Bearer header optional for non-browser clients)
- Use short-lived access tokens plus rotating refresh tokens; store only hashes of refresh tokens
- Use guards to protect routes and custom decorators for user context
- Re-check the user in `JwtStrategy.validate` so tokens of deleted users are rejected

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
```

### **Role-Based Access Control**

- Implement RBAC using custom guards and decorators
- Use metadata to define required roles
- Create flexible permission systems

```typescript
@SetMetadata('roles', ['admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async remove(@Param('id') id: string): Promise<void> {
  return this.usersService.remove(id);
}
```

## Error Handling and Logging

### **Exception Filters**

- Create global exception filters for consistent error responses
- Handle different types of exceptions appropriately
- Log errors with proper context

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {} // nestjs-pino

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(
        exception,
        `Unhandled exception on ${req.method} ${req.url}`,
      );
    }

    res.status(status).json({
      statusCode: status,
      message: 'Internal server error', // HttpException message when available
      path: req.url,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### **Logging**

- Use `nestjs-pino` (structured JSON logs; pretty output only outside production)
- Give every request an id (`X-Request-Id`) and include it in logs and error bodies
- Redact credentials (`authorization`, `cookie`, `set-cookie`) and never log passwords or tokens
- Log security events (sign-in, refresh, sign-out, token reuse) as structured audit entries
- Use proper log levels (error, warn, info, debug); reuse of a refresh token is a warning
- Add contextual information to logs

## Testing Strategies

### **Unit Testing**

- Test services independently using mocks
- Use Vitest as the testing framework (`vi.fn()`, `vi.spyOn()`; `globals: true`, so `describe`/`it`/`expect` need no import)
- Create comprehensive test suites for business logic
- Mock Mongoose models with `getModelToken()` and a stub exposing only the methods the code calls

```typescript
describe('UsersService', () => {
  let service: UsersService;
  const model = { create: vi.fn(), findOne: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('creates a user', async () => {
    const data = { email: 'a@b.com', name: 'John', password: 'h' };
    model.create.mockResolvedValue({ id: '1', ...data });

    expect(await service.create(data)).toEqual({ id: '1', ...data });
  });
});
```

### **Integration Testing**

- Use TestingModule for integration tests
- Test complete request/response cycles
- Mock external dependencies appropriately

### **E2E Testing**

- Test complete application flows
- Use supertest for HTTP testing (`npm run test:e2e`, config in `vitest.config.e2e.ts`)
- Test authentication and authorization flows

## Performance and Security

### **Performance Optimization**

- Implement caching (e.g. Redis) and pagination once list endpoints or hot reads exist
- Use interceptors for response transformation when needed
- Optimize database queries with proper indexing

### **Security Best Practices**

- Validate all inputs using class-validator (global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`)
- Implement rate limiting to prevent abuse, with stricter limits on credential endpoints
- Use a CORS allow-list and, for cookie auth, verify `Origin` on state-changing requests (CSRF)
- Set security headers with Helmet
- Sanitize outputs to prevent XSS attacks
- Use environment variables for sensitive configuration

```typescript
// Rate limiting: global ThrottlerGuard (APP_GUARD) plus per-route overrides
@Controller('auth')
export class AuthController {
  @Post('signin')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 requests per minute
  async signIn(@Body() dto: SignInDto) {
    return this.auth.signIn(dto);
  }
}
```

## Configuration Management

### **Environment Configuration**

- Use @nestjs/config for configuration management
- Validate configuration at startup with a class-validator schema
- Use `forRootAsync` when module options depend on `ConfigService`
- Read values with `getOrThrow()` so missing settings fail fast

```typescript
ConfigModule.forRoot({ isGlobal: true, validate: validateEnv });

MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.getOrThrow<string>('MONGODB_URI'),
  }),
});
```

## Common Pitfalls to Avoid

- **Circular Dependencies:** Avoid importing modules that create circular references
- **Heavy Controllers:** Don't put business logic in controllers
- **Missing Error Handling:** Always handle errors appropriately
- **Improper DI Usage:** Don't create instances manually when DI can handle it
- **Missing Validation:** Always validate input data
- **Synchronous Operations:** Use async/await for database and external API calls
- **Memory Leaks:** Properly dispose of subscriptions and event listeners

## Development Workflow

### **Development Setup**

1. Use NestJS CLI for scaffolding: `nest generate module users`
2. Follow consistent file organization
3. Use TypeScript strict mode
4. Lint with oxlint (`npm run lint`)
5. Use Prettier for code formatting

### **Code Review Checklist**

- [ ] Proper use of decorators and dependency injection
- [ ] Input validation with DTOs and class-validator
- [ ] Appropriate error handling and exception filters
- [ ] Consistent naming conventions
- [ ] Proper module organization and imports
- [ ] Security considerations (authentication, authorization, input sanitization)
- [ ] Performance considerations (caching, database optimization)
- [ ] Comprehensive testing coverage

## Conclusion

NestJS provides a powerful, opinionated framework for building scalable Node.js applications. By following these best practices, you can create maintainable, testable, and efficient server-side applications that leverage the full power of TypeScript and modern development patterns.

---

<!-- End of NestJS Instructions -->
