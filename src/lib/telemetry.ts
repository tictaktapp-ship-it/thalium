import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { Span, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

let telemetryInitialised = false;

/**
 * Initialises OpenTelemetry NodeSDK with Honeycomb OTLP exporter
 * Safe to call multiple times (no-op after first successful initialisation)
 */
export function initTelemetry(): void {
  if (telemetryInitialised) return;

  const honeycombApiKey = process.env.HONEYCOMB_API_KEY;
  if (!honeycombApiKey) {
    diag.warn('HONEYCOMB_API_KEY not set - telemetry will not be initialised');
    return;
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

  const samplingRate = process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  const sampler = new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(samplingRate),
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'thalium',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      'env': process.env.NODE_ENV || 'development',
      'region': process.env.FLY_REGION || 'local',
    }),
    traceExporter: new OTLPTraceExporter({
      url: 'https://api.honeycomb.io/v1/traces',
      headers: {
        'x-honeycomb-team': honeycombApiKey,
        'x-honeycomb-dataset': process.env.HONEYCOMB_DATASET || 'thalium',
      },
    }),    sampler,
  });

  try {
    sdk.start();
    telemetryInitialised = true;
  } catch (err: unknown) {
    diag.error('Error initializing OpenTelemetry SDK', String(err));
  }
}

/**
 * Type for span attributes with common Thalium-specific fields
 */
export type SpanAttributes = {
  brain_id?: string;
  anchor_id?: string;
  trace_id?: string;
  tier?: string;
  intent_type?: string;
  env?: string;
  [key: string]: string | number | boolean | undefined;
};

/**
 * Starts a new span, executes the provided function within its context, and ensures proper error handling
 * @param name Span name
 * @param attributes Attributes to set on the span
 * @param fn Function to execute within the span context
 * @returns Promise resolving to the result of fn
 */
export async function startSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Set attributes, skipping undefined values
      Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined) {
          span.setAttribute(key, value);
        }
      });

      const result = await fn(span);
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Gets the Thalium tracer instance
 * @returns Configured Tracer instance
 */
export function getTracer(): Tracer {
  return trace.getTracer('thalium', '1.0.0');
}

/**
 * Standard span names used throughout Thalium
 */
export const spanNames = {
  HTTP_REQUEST: 'http.request',
  CHAIN_START: 'chain.start',
  ROLE_TRIAGE: 'role.triage',
  ROLE_LISTENER: 'role.listener',
  ROLE_INTERROGATOR: 'role.interrogator',
  ROLE_ARCHITECT: 'role.architect',
  ROLE_DEVIL: 'role.devil',
  ROLE_SCORER: 'role.scorer',
  ROLE_VALIDATOR: 'role.validator',
  ROLE_BOUNDARY_KEEPER: 'role.boundary_keeper',
  ROLE_SCRIBE: 'role.scribe',
  ROLE_AUDITOR: 'role.auditor',
  ROLE_LIBRARIAN: 'role.librarian',
  ROLE_ROUTER: 'role.router',
  ROLE_FORECASTER: 'role.forecaster',
  SSE_EMIT: 'sse.emit',
  RING_READ: 'ring.read',
  RING_WRITE: 'ring.write',
  COVERAGE_MAP_READ: 'coverage_map.read',
  BUFFER_DRAIN: 'buffer.drain',
  CALIBRATOR_RUN: 'calibrator.run',
} as const;

