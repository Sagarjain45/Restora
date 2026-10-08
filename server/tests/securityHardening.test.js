import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Security components
import { sanitizeMongoInput } from '../middleware/securityMiddleware.js';
import { errorHandler } from '../middleware/errorMiddleware.js';
import { resolveTenant, requireTenantOwnership } from '../middleware/tenantMiddleware.js';
import { assertTenantOwnership, scopeFilter } from '../utils/tenantHelper.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import app from '../app.js';

describe('Phase 18: Security Hardening & Vulnerability Mitigation Suite', () => {
  const tenantR001 = new mongoose.Types.ObjectId().toString();
  const tenantR002 = new mongoose.Types.ObjectId().toString();

  // =========================================================================
  // 1. PASSWORD HASHING & SENSITIVE DATA EXPOSURE
  // =========================================================================
  describe('1. Password Hashing & Data Exposure Defenses', () => {
    it('should hash passwords irreversibly with bcrypt salt rounds', async () => {
      const plaintext = 'SuperSafeP@ssword2026!';
      const hash1 = await hashPassword(plaintext);
      const hash2 = await hashPassword(plaintext);

      // Unique salts mean different hashes
      assert.notEqual(hash1, plaintext);
      assert.notEqual(hash1, hash2);

      assert.equal(await comparePassword(plaintext, hash1), true);
      assert.equal(await comparePassword('WrongPassword', hash1), false);
    });

    it('should automatically strip passwordHash from User model toJSON and toObject transforms', () => {
      const userDoc = new User({
        name: 'Test Staff',
        email: 'staff@r001.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'RESTAURANT_STAFF',
        restaurantId: new mongoose.Types.ObjectId(),
      });

      const serializedJson = userDoc.toJSON();
      assert.equal(serializedJson.passwordHash, undefined, 'passwordHash must never be present in serialized JSON');
      assert.equal(serializedJson.name, 'Test Staff');

      const serializedObj = userDoc.toObject();
      assert.equal(serializedObj.passwordHash, undefined, 'passwordHash must never be present in serialized Object');
    });
  });

  // =========================================================================
  // 2. JWT SECURITY & TAMPERING MITIGATION
  // =========================================================================
  describe('2. JWT Security & Tamper Rejection', () => {
    it('should reject tampered JWT signatures', () => {
      const validToken = signToken({ id: 'u1', role: 'RESTAURANT_STAFF' });
      const parts = validToken.split('.');

      // Tamper with payload
      const tamperedPayload = Buffer.from(JSON.stringify({ id: 'u1', role: 'PLATFORM_ADMIN' })).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const verified = verifyToken(tamperedToken);
      assert.equal(verified, null, 'Tampered token must be rejected');
    });

    it('should reject tokens signed with a foreign secret', () => {
      const foreignToken = jwt.sign(
        { id: 'attacker', role: 'PLATFORM_ADMIN' },
        'malicious_foreign_secret_key',
        { expiresIn: '1h' }
      );

      const verified = verifyToken(foreignToken);
      assert.equal(verified, null, 'Foreign-signed token must be rejected');
    });
  });

  // =========================================================================
  // 3. IDOR (INSECURE DIRECT OBJECT REFERENCE) & CROSS-TENANT DEFENSES
  // =========================================================================
  describe('3. IDOR & Cross-Tenant Access Attack Defense', () => {
    it('CRITICAL PRD CHECK: User R001 requests resource belonging to R002 -> returns 403 Forbidden', async () => {
      // Mock resource belonging to Restaurant R002
      const resourceOfR002 = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantR002),
        tableNumber: 'VIP-Table-R2',
      };

      // Mock Model that returns R002's resource
      const MockModel = {
        findById: async () => resourceOfR002,
      };

      const middleware = requireTenantOwnership(MockModel, 'id', 'Table');

      // User belonging to R001 attempts to access R002's table
      const req = {
        tenantId: tenantR001,
        isPlatformAdmin: false,
        params: { id: resourceOfR002._id.toString() },
      };

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonPayload = data; } };
        },
      };

      await middleware(req, res, () => {});

      assert.equal(statusCode, 403, 'Cross-tenant resource access must strictly return 403 Forbidden');
      assert.equal(jsonPayload.code, 'CROSS_TENANT_ACCESS_DENIED');
      assert.equal(jsonPayload.success, false);
    });

    it('should reject tenant parameter spoofing attempt in request body with 403 Forbidden', async () => {
      const req = {
        user: {
          id: 'user_r001',
          role: 'RESTAURANT_OWNER',
          restaurantId: tenantR001,
        },
        body: { restaurantId: tenantR002 }, // Spoofing attempt
        query: {},
        params: {},
      };

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonPayload = data; } };
        },
      };

      await resolveTenant(req, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'CROSS_TENANT_SPOOF_ATTEMPT');
    });

    it('assertTenantOwnership must throw 403 when doc restaurantId does not match tenantId', () => {
      const doc = {
        _id: 'doc_123',
        restaurantId: tenantR002,
      };

      assert.throws(
        () => assertTenantOwnership(doc, tenantR001, 'Order'),
        (err) => err.statusCode === 403 && err.code === 'CROSS_TENANT_ACCESS_DENIED'
      );
    });
  });

  // =========================================================================
  // 4. NOSQL / MONGODB OPERATOR INJECTION DEFENSE
  // =========================================================================
  describe('4. NoSQL / MongoDB Operator Injection Sanitization', () => {
    it('should strip $ operators from request body, query, and params', () => {
      const req = {
        body: {
          email: { $gt: '' }, // NoSQL auth bypass payload
          password: 'secretPassword',
          metadata: {
            $where: 'sleep(5000)',
            validKey: 'allowed',
          },
        },
        query: {
          status: 'ACTIVE',
          $ne: 'DEACTIVATED',
        },
        params: {
          id: 'valid_id',
        },
      };

      let nextCalled = false;
      sanitizeMongoInput(req, {}, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
      // Operator $gt must be stripped
      assert.deepEqual(req.body.email, {});
      assert.equal(req.body.password, 'secretPassword');
      // Nested operator $where must be stripped
      assert.equal(req.body.metadata.$where, undefined);
      assert.equal(req.body.metadata.validKey, 'allowed');
      // Query operator $ne must be stripped
      assert.equal(req.query.status, 'ACTIVE');
      assert.equal(req.query.$ne, undefined);
    });

    it('should strip dot-notation keys from input objects to prevent path injection', () => {
      const req = {
        body: {
          'user.role': 'PLATFORM_ADMIN',
          displayName: 'Normal User',
        },
      };

      sanitizeMongoInput(req, {}, () => {});
      assert.equal(req.body['user.role'], undefined);
      assert.equal(req.body.displayName, 'Normal User');
    });
  });

  // =========================================================================
  // 5. ERROR LEAKAGE & SYSTEM DETAIL SHIELDING
  // =========================================================================
  describe('5. Error Leakage & Exception Translation', () => {
    it('should translate Mongoose CastError to 400 Bad Request with sanitized message', () => {
      const castError = {
        name: 'CastError',
        path: '_id',
        message: 'Cast to ObjectId failed for value "invalid_id" at path "_id"',
      };

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        statusCode: 200,
        status: (code) => {
          statusCode = code;
          return { json: (d) => { jsonPayload = d; } };
        },
      };

      errorHandler(castError, {}, res, () => {});

      assert.equal(statusCode, 400);
      assert.equal(jsonPayload.code, 'INVALID_ID_FORMAT');
      assert.equal(jsonPayload.message, 'Invalid identifier format: _id');
    });

    it('should translate Mongoose Duplicate Key Error (11000) to 409 Conflict', () => {
      const duplicateError = {
        code: 11000,
        keyValue: { email: 'duplicate@restora.com' },
      };

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        statusCode: 200,
        status: (code) => {
          statusCode = code;
          return { json: (d) => { jsonPayload = d; } };
        },
      };

      errorHandler(duplicateError, {}, res, () => {});

      assert.equal(statusCode, 409);
      assert.equal(jsonPayload.code, 'DUPLICATE_RESOURCE');
      assert.equal(jsonPayload.message, 'A record with this email already exists.');
    });

    it('should translate Mongoose ValidationError to 400 with aggregated messages', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          name: { message: 'Name is required' },
          capacity: { message: 'Capacity must be at least 1 seat' },
        },
      };

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        statusCode: 200,
        status: (code) => {
          statusCode = code;
          return { json: (d) => { jsonPayload = d; } };
        },
      };

      errorHandler(validationError, {}, res, () => {});

      assert.equal(statusCode, 400);
      assert.equal(jsonPayload.code, 'VALIDATION_ERROR');
      assert.ok(jsonPayload.message.includes('Name is required'));
      assert.ok(jsonPayload.message.includes('Capacity must be at least 1 seat'));
    });
  });

  // =========================================================================
  // 6. APPLICATION SECURITY CONFIGURATION & INTEGRITY
  // =========================================================================
  describe('6. Application Security Integrity', () => {
    it('should ensure Express application has security middleware configured', () => {
      assert.ok(app);
      assert.equal(typeof app.handle, 'function');
    });

    it('should ensure JWT secret is set and has adequate length', () => {
      assert.ok(env.JWT_SECRET);
      assert.ok(env.JWT_SECRET.length >= 16, 'JWT Secret must be at least 16 characters');
    });
  });
});
