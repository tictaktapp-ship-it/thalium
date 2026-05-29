import request from 'supertest';
import { app } from '../../app';
import { redisShardA } from '../../lib/redis';
import { AddressKeySchema } from '../../schemas/address-key';
import { v4 as uuidv4 } from 'uuid';

describe('POST /invoke', () => {
  beforeEach(async () => {
    await redisShardA.flushall();
  });

  it('rejects requests without X-Request-ID header', async () => {
    const res = await request(app)
      .post('/invoke')
      .send({ address_key: 'diagnosis.project.medical.medium' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing X-Request-ID header');
  });

  it('rejects invalid address key format', async () => {
    const res = await request(app)
      .post('/invoke')
      .set('X-Request-ID', uuidv4())
      .send({ address_key: 'invalid.format' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid address key format/);
  });

  it('accepts valid invoke request with correct headers and scope', async () => {
    const validKey = 'diagnosis.project.medical.medium';
    AddressKeySchema.parse(validKey); // Validate against our schema

    const res = await request(app)
      .post('/invoke')
      .set('X-Request-ID', uuidv4())
      .send({ address_key: validKey });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/event-stream; charset=utf-8');
  });

  it('rejects when coverage map reports empty region', async () => {
    const emptyRegionKey = 'knowledge_retrieval.entity.obscure.nonexistent';
    jest.spyOn(redisShardA, 'exists').mockResolvedValue(0);

    const res = await request(app)
      .post('/invoke')
      .set('X-Request-ID', uuidv4())
      .send({ address_key: emptyRegionKey });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Address key region has no coverage');
  });

  it('rejects when domain uncertainty exceeds threshold', async () => {
    const uncertainKey = 'risk_assessment.org.financial.high';
    jest.spyOn(redisShardA, 'hget').mockResolvedValue('0.91'); // Above 0.9 threshold

    const res = await request(app)
      .post('/invoke')
      .set('X-Request-ID', uuidv4())
      .send({ address_key: uncertainKey });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Domain uncertainty threshold exceeded');
  });
});