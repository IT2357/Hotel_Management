/**
 * GENERATED FILE FROM THE TYPESCRIPT-WORKSHEET EXTENSION
*/
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import "dotenv/config";
import { connectDB, dbHealthCheck } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/adminRoutes.js";
import * as __fs from 'node:fs';
import os from 'node:os';
const dataFile: any[] = [];

async function __tsrun() {
try {

const app =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'app',  called: () => (express()), line: 19});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.set("trust proxy", 1)), line: 20});

// Global middleware
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(helmet())), line: 23});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(compression())), line: 24});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(morgan("combined"))), line: 25});

const corsOptions =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'corsOptions',  called: () => ({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}), line: 27});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(cors(corsOptions))), line: 33});

const limiter =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'limiter',  called: () => (rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
})), line: 35});

const authLimiter =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'authLimiter',  called: () => (rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
})), line: 46});

if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (process.env.NODE_ENV === "production"), line: 57})) {
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use("/api/", limiter)), line: 58});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use("/api/auth/", authLimiter)), line: 59});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(express.json({ limit: "10mb" }))), line: 60});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(express.urlencoded({ extended: true, limit: "10mb" }))), line: 61});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(mongoSanitize())), line: 62});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(xss())), line: 63});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(hpp({}))), line: 64});
} else {
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(express.json())), line: 66});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use(express.urlencoded({ extended: true }))), line: 67});
  // Optionally add logger, dev-specific middleware here
}

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (connectDB()), line: 71});

await tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: async () => (app.get("/health", async (req, res) => {
  const dbHealth = await tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dbHealth',  called: async () => (await tsWorksheetWatch({stringed: 'empty', type: 'expression', hide: true,  called: async () => (await dbHealthCheck()), line: 74})), line: 74});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (res.status(dbHealth.status === "healthy" ? 200 : 503).json({
        success: dbHealth.status === "healthy",
        message: "Server health check",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: dbHealth,
      })), line: 75});
})), line: 73});

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use("/api/auth", authRoutes)), line: 89});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use("/api/admin", adminRoutes)), line: 90});

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use("/api", (req, res) => {
  mylog(console.warn, {type: 'log', called: [`🔍 Unknown API route: ${req.originalUrl}`], line: 93});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (res.status(404).json({
        success: false,
        message: "API endpoint not found",
      })), line: 94});
})), line: 92});

// console.log("👀 Starting server.mjs...");

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.get("/", (req, res) => {
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (res.json({
        success: true,
        message: "Hotel Management System API",
        version: "1.0.0",
        documentation: "/api/docs",
        endpoints: {
          auth: "/api/auth",
          health: "/health",
        },
      })), line: 103});
})), line: 102});

// Global error handler
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app.use((err, req, res, next) => {
  mylog(console.error, {type: 'log', called: ["Global error handler:", err], line: 117});

  if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (err.name === "ValidationError"), line: 119})) {
    const errors =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'errors',  called: () => (Object.values(err.errors).map((val: any) => val.message)), line: 120});
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (err.code === 11000), line: 128})) {
    const field =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'field',  called: () => (Object.keys(err.keyValue)[0]), line: 129});
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (err.name === "CastError"), line: 136})) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (err.name === "JsonWebTokenError"), line: 143})) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (err.name === "TokenExpiredError"), line: 150})) {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      })), line: 157});
})), line: 116});

// Start server
const PORT =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'PORT',  called: () => (process.env.PORT), line: 165});
const server =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'server',  called: () => (app.listen(PORT, () => {
  mylog(console.log, {type: 'log', called: [`
🚀 Server running in ${
        process.env.NODE_ENV || "development"
      } mode on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
🔐 Auth API: http://localhost:${PORT}/api/auth
📚 Documentation: http://localhost:${PORT}/api/docs
  `], line: 167});
})), line: 166});

// Handle termination
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (process.on("unhandledRejection", (err) => {
  mylog(console.error, {type: 'log', called: ["Unhandled Promise Rejection:", err], line: 179});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (server.close(() => process.exit(1))), line: 180});
})), line: 178});

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (process.on("uncaughtException", (err) => {
  mylog(console.error, {type: 'log', called: ["Uncaught Exception:", err], line: 184});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (process.exit(1)), line: 185});
})), line: 183});

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (process.on("SIGTERM", () => {
  mylog(console.log, {type: 'log', called: ["SIGTERM received. Shutting down gracefully..."], line: 189});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (server.close(() => console.log("Process terminated"))), line: 190});
})), line: 188});

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (process.on("SIGINT", () => {
  mylog(console.log, {type: 'log', called: ["SIGINT received. Shutting down gracefully..."], line: 194});
   tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (server.close(() => console.log("Process terminated"))), line: 195});
})), line: 193});

 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (app), line: 198});

} catch(error) {

  
}
}

__tsrun().then()

let ___done_ts_worksheet = "";
___done_ts_worksheet = "asdf";


function stringify(obj: any) {
  let cache: any = [];
  let str = JSON.stringify(obj, function(key, value) {
    if(typeof value === 'function') {
      const fn = __tsGetFn(value.toString()) ?? __tsGetArrowFn(value.toString());
      return fn;
    }
    if(value === undefined) {
      return '__TS_WORKSHEET_UNDEFINED__'
    }
    if (typeof value === "object" && value !== null) {
      if(value?.then) {
        return 'Promise';
      }
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
      return value === undefined ? '__TS_WORKSHEET_UNDEFINED__' : value;
    }
    return value;
  });
  cache = null; // reset the cache
  return str;
}



function __tsGetFn(str: string) {
  const noSpaces = str.replaceAll(' ', '');
  const __tsFnWithArgs = /(function.*\(.*\))/
  const result = __tsFnWithArgs.exec(noSpaces);
  if(result?.length) {
    
    const fn = result.at(-1);
    if (fn) {
        const afterKey = fn.substring('function'.length);
        return 'function ' + afterKey;
    } else {
        return undefined;
    }
  }
  return undefined;
}

function __tsGetArrowFn(str: string) {
  const noSpaces = str.replaceAll(' ', '');
  const __tsArrowWithArgs= /(\({0,1}[A-Za-z]{1}[A-Za-z0-9_,]*\){0,1})=>/;
const __tsArrorWithoutArgs = /\(\){1}=>/;
  const arrowWithArgsResult = __tsArrowWithArgs.exec(noSpaces);
  if(arrowWithArgsResult?.length) {
    const args =  arrowWithArgsResult.at(-1);
    return 'arrow fn(' + args + ')';
  }
  const arrowWithoutArgsResult = __tsArrorWithoutArgs.exec(noSpaces);
  if(arrowWithoutArgsResult?.length) {
    return 'arrow fn()';
  }
  return undefined;
}

function tryToStringify(value: any) {
    let res = '';
    try {
        switch(typeof value) {
            case 'object':
                res = stringify(value);
                break;
            case 'function':
                res = __tsGetFn(value.toString()) ?? __tsGetArrowFn(value.toString()) ?? '';
                break;
            case 'bigint':
                res = value?.toString();
                break;    
            default: 
                // isNaN
                if(value !== value) {
                  res = value?.toString();
                } else {
                  res = value === undefined ? '__TS_WORKSHEET_UNDEFINED__' : value;
                }
        }
    } catch(err: any) {
        return err?.message.startsWith('Convert') ? 'Non displayable' : err?.message;
    }
    return res?.length > 2000 ? res?.substring(0, 2000) : res;
}

function __onError(error: any, dataValue: any) {
  const fixedError = error?.stack ?? error;
  const stringError = JSON.stringify(fixedError, Object.getOwnPropertyNames(fixedError));

  dataValue.type = 'error';
  dataValue.called = [error.message , stringError];
}
declare const Bun: any;
function save(hide: boolean, dataValue?: any) {
  if(hide) {
    return;
  }
  const isIpcCompatible = !false && typeof Bun === 'undefined' && !globalThis?.Deno && !os.platform().startsWith('win');
  if(dataValue) {
    dataFile.push(dataValue);
  }

  if(isIpcCompatible && process.send) {
    process.send(dataValue);
  }

  if(!dataValue && !isIpcCompatible) {
    __fs.writeFileSync('c:\\Users\\jeyan\\Desktop\\Uni\\1test\\Hotel_management\\backend\\.ws.data.json', JSON.stringify(dataFile));  
  }
}

function tsWorksheetWatch(data: {stringed: string, hide?: boolean, type: string, variable?: string, called: () => any, line: number }) {
  const dataValue: {
    called: string;
    stringed: string;
    hide?: boolean;
    type: string;
    variable?: string;
    line: number;
    prefix?: string;
  } = {
    called: '',
    stringed: data.stringed,
    hide: data.hide,
    type: data.type,
    variable: data.variable,
    line: data.line,
    prefix: '',
  };
  let called: any;
  try {
      called = data.called();
  } catch(error) {
      __onError(error, dataValue);
      save(data.hide ?? false, dataValue);
      throw error;
  }

  if(data.type === 'throw') {
      __onError(called, dataValue);
      save(data.hide ?? false, dataValue);
      throw called;
  }

  if(called?.then) {
     data.called = called.then((r: any) => {
      dataValue.prefix = 'Resolved Promise: ';
        dataValue.called = tryToStringify(r);
         save(data.hide ?? false, dataValue);
         return r;
     }).catch((err: any) => {
      dataValue.prefix = 'Rejected Promise: ';
      dataValue.called = tryToStringify(err);
      dataValue.type = 'error';
      save(data.hide ?? false, dataValue);
      throw err;
     });
  } else {
      dataValue.called = tryToStringify(called);
      save(data.hide ?? false, dataValue);
  }

  return called;
}

function mylog(logFn: any, data: {type: string, called: any[], line: number }) {
    logFn(...data.called);
    data.called = data.called.map(entry => tryToStringify(entry)); 
    save(false, data);
}

if (globalThis?.Deno) {

  addEventListener("error", (event) => {
    event.preventDefault();
  });
  
  addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
  });
  
  addEventListener("unload", () => {
    save(false);
  });
  }
  process?.on('uncaughtException', (error: Error) => {   
  });
  
  process?.on('unhandledRejection', () => {})
  
  process?.on('beforeExit', e => {
    if(typeof Bun !== 'undefined' && dataFile.some(e => e.type === 'error')) {
      process.exit(0);
    }
  })
  
  process?.on('exit', function() {
    save(false);
  });
      
    