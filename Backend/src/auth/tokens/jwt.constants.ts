export const JWT_ALGORITHM = 'HS256';
export const JWT_ISSUER = 'easygenerator-auth-api';
export const JWT_AUDIENCE = 'easygenerator-web';
// A distinct audience stops access tokens being accepted as refresh tokens and vice versa.
export const JWT_REFRESH_AUDIENCE = `${JWT_AUDIENCE}:refresh`;
