import jwt from "express-jwt";
import jwtAuthz from "express-jwt-authz";
import jwksRsa from "jwks-rsa";
import dotenv from "dotenv";
dotenv.config();

// const uri = `${process.env.AUTH0_ISSUER}.well-known/jwks.json`;
//`https://octo-tako.au.auth0.com/.well-known/jwks.json`

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
      jwksUri: `${process.env.AUTH0_ISSUER}.well-known/jwks.json`,
    }),
  
    // Validate the audience and the issuer.
    audience: process.env.AUTH0_AUDIENCE,
    // issuer: [`https://octo-tako.au.auth0.com/`],
    issuer: process.env.AUTH0_ISSUER,
    algorithms: ['RS256']
  });

export default checkJwt;