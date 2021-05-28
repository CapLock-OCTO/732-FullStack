//This file is for solution 1 only, solution 2 would not use this.

import nock from "nock";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { key_n_encoded, key_e_encoded, privateKeyMock } from "./mock-key-values";

const auth0 = {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: process.env.AUTH0_ISSUER,
}

const nockReply = {
    keys: [{
        alg: 'RS256',
        kty: 'RSA',
        use: 'sig',
        n: key_n_encoded, //eslint-disable-line max-len
        e: key_e_encoded,
        kid: '0',
    }]
}

nock(auth0.issuer)
    .persist()
    .get('/.well-known/jwks.json')
    .reply(200, nockReply)

const getToken = () => {
    const user = {
        email: "testuser@gmail.com"
    };

    const payload = {
        user:{
            userSub: "AaBbCcDdEeFfGgHh"
        }
    };

    const options = {
        header: { kid: '0' },
        algorithm: 'RS256',
        expiresIn: '1d',
        audience: auth0.audience,
        issuer: auth0.issuer,
    };

    let token;

    try {
        token = jwt.sign(payload, privateKeyMock, options);
    }
    catch (e) {
        console.log(e);
        throw e;
    }

    return token;
}

export default getToken;