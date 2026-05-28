import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockRunChain: vi.fn(),
  mockCreateSSEResponse: vi.fn(),
}));

vi.mock('../../chain/coordinator', () => ({ runChain: mocks.mockRunChain }));
vi.mock('../../sse/emitter', () => ({
  createSSEResponse: mocks.mockCreateSSEResponse,
}));

import { handleChainInvocation, validateInvocationRequest } from '../../api/chain-executor';
import { LibrarianError } from '../../lib/librarian-write';

const validBody = {
  input: 'Build a SaaS marketplace',
  brain_id: '87654321-4321-4321-4321-210987654321',
  domain: 'software',
};

const mockEmitter = { emit: vi.fn(), close: vi.fn() };

const createMockRes = () => ({
  write: vi.fn(() => true),
  end: vi.fn(),
  setHeader: vi.fn(),
  status: vi.fn(() => ({ json: vi.fn() })),
});

const createMockReq = (body: unknown, internalHeader = 'test-secret') => ({
  body,
  headers: { 'x-thalium-internal': internalHeader },
});

describe('chain-executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.X_THALIUM_INTERNAL = 'test-secret';
    mocks.mockCreateSSEResponse.mockReturnValue(mockEmitter);
    mocks.mockRunChain.mockResolvedValue(undefined);
  });

  describe('validateInvocationRequest', () => {
    it('returns valid request for correct body', () => {
      const result = validateInvocationRequest(validBody);
      expect(result.input).toBe(validBody.input);
      expect(result.brain_id).toBe(validBody.brain_id);
      expect(result.domain).toBe(validBody.domain);
    });

    it('throws VALIDATION_FAILED when input is missing', () => {
      try {
        validateInvocationRequest({ ...validBody, input: '' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });

    it('throws VALIDATION_FAILED when brain_id is missing', () => {
      try {
        validateInvocationRequest({ ...validBody, brain_id: '' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LibrarianError);
        expect((err as LibrarianError).code).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('handleChainInvocation', () => {
    it('returns 401 when X-Thalium-Internal header is missing', async () => {
      const req = createMockReq(validBody, '');
      const res = createMockRes();
      await handleChainInvocation(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when request body is invalid', async () => {
      const req = createMockReq({ input: '' });
      const res = createMockRes();
      await handleChainInvocation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls runChain with correct ChainInput on valid request', async () => {
      const req = createMockReq(validBody);
      const res = createMockRes();
      await handleChainInvocation(req, res);
      expect(mocks.mockRunChain).toHaveBeenCalledWith(
        expect.objectContaining({
          input: validBody.input,
          brainId: validBody.brain_id,
          domain: validBody.domain,
        }),
        mockEmitter
      );
    });

    it('closes emitter after runChain completes', async () => {
      const req = createMockReq(validBody);
      const res = createMockRes();
      await handleChainInvocation(req, res);
      expect(mockEmitter.close).toHaveBeenCalled();
    });
  });
});
