import axios from "axios";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { env } from "../config/env.js";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older Node versions may not support this API.
}

function lookupIPv4(hostname, options, callback) {
  dns.lookup(hostname, { ...options, family: 4, all: false }, (error, address, family) => {
    if (!error) {
      callback(null, address, family);
      return;
    }

    dns.resolve4(hostname, (resolveError, addresses) => {
      if (resolveError || !addresses?.[0]) {
        callback(error || resolveError);
        return;
      }
      callback(null, addresses[0], 4);
    });
  });
}

const agentOptions = {
  family: 4,
  keepAlive: true,
  lookup: lookupIPv4,
};

export const httpClient = axios.create({
  timeout: env.requestTimeoutMs,
  httpAgent: new http.Agent(agentOptions),
  httpsAgent: new https.Agent(agentOptions),
  headers: {
    Accept: "application/json",
    "User-Agent": "BharatKisanAI/1.0 (+https://backend-7am6.vercel.app)",
  },
});

function isRetryable(error) {
  const status = error.response?.status;
  const code = error.code;
  return (
    status >= 500 ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  );
}

export async function getWithRetry(url, config = {}, attempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await httpClient.get(url, config);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 200 * attempt);
      });
    }
  }

  throw lastError;
}
