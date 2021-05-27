import { jwt } from "express-jwt";
import { jwtAuthz } from "express-jwt-authz";
import { jwksRsa } from "jwks-rsa";

const audience = process.env.AUTH0_AUDIENCE;

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://octo-tako.au.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    audience: { audience },
    issuer: [`https://octo-tako.au.auth0.com/`],
    algorithms: ['RS256']
  });

export default checkJwt;