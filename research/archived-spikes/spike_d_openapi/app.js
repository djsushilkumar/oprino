import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import multipart from '@fastify/multipart';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function buildApp() {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Oprino Architecture Validation API',
        description: 'OpenAPI contract spike validating Fastify Zod to Dart Dio codegen',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3099',
          description: 'Local Validation Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Opaque Session Token',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  // Domain schemas
  const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
  const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

  const LocationCoordinateSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().nullable().optional(),
  });

  const TaskItemSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().nullable(),
    status: TaskStatusEnum,
    priority: PriorityEnum,
    assignedUserId: z.string().uuid().nullable(),
    location: LocationCoordinateSchema.nullable(),
    tags: z.array(z.string()),
    dueAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  const PaginatedTasksResponseSchema = z.object({
    items: z.array(TaskItemSchema),
    pagination: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      hasMore: z.boolean(),
    }),
  });

  const CreateTaskRequestSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().nullable().optional(),
    priority: PriorityEnum.default('MEDIUM'),
    assignedUserId: z.string().uuid().nullable().optional(),
    location: LocationCoordinateSchema.nullable().optional(),
    tags: z.array(z.string()).default([]),
    dueAt: z.string().datetime().nullable().optional(),
  });

  const ValidationErrorSchema = z.object({
    statusCode: z.number(),
    error: z.string(),
    message: z.string(),
    details: z.array(
      z.object({
        path: z.string(),
        message: z.string(),
      })
    ).optional(),
  });

  const UploadProofResponseSchema = z.object({
    fileId: z.string().uuid(),
    fileName: z.string(),
    contentType: z.string(),
    sizeBytes: z.number().int(),
    uploadedAt: z.string().datetime(),
  });

  // Endpoints

  // 1. Paginated Query with Arrays, UUID, Enums, Nullable, Nested Objects
  app.get(
    '/v1/tasks',
    {
      schema: {
        operationId: 'listTasks',
        tags: ['Tasks'],
        summary: 'List tasks with pagination and status filter',
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(20),
          status: TaskStatusEnum.optional(),
          search: z.string().optional(),
        }),
        response: {
          200: PaginatedTasksResponseSchema,
          400: ValidationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { page, limit, status } = request.query;
      return {
        items: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Verify HVAC Filter at Sector 62',
            description: 'Routine maintenance and filter replacement check.',
            status: status || 'PENDING',
            priority: 'HIGH',
            assignedUserId: '22222222-2222-4222-8222-222222222222',
            location: {
              latitude: 28.628,
              longitude: 77.3649,
              accuracy: 5.2,
            },
            tags: ['hvac', 'maintenance', 'quarterly'],
            dueAt: new Date(Date.now() + 86400000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        pagination: {
          total: 1,
          page,
          limit,
          hasMore: false,
        },
      };
    }
  );

  // 2. Create Task Mutation with Validation Errors
  app.post(
    '/v1/tasks',
    {
      schema: {
        operationId: 'createTask',
        tags: ['Tasks'],
        summary: 'Create a new operational task',
        body: CreateTaskRequestSchema,
        response: {
          201: TaskItemSchema,
          400: ValidationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body;
      reply.code(201);
      return {
        id: '33333333-3333-4333-8333-333333333333',
        title: body.title,
        description: body.description ?? null,
        status: 'PENDING',
        priority: body.priority,
        assignedUserId: body.assignedUserId ?? null,
        location: body.location ?? null,
        tags: body.tags ?? [],
        dueAt: body.dueAt ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  );

  // 3. Multipart Upload
  app.post(
    '/v1/proof/upload',
    {
      schema: {
        operationId: 'uploadProofPhoto',
        tags: ['Proof'],
        summary: 'Upload proof of work photo',
        consumes: ['multipart/form-data'],
        response: {
          200: UploadProofResponseSchema,
          400: ValidationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        reply.code(400);
        return { statusCode: 400, error: 'Bad Request', message: 'No file uploaded' };
      }
      const buffer = await data.toBuffer();
      return {
        fileId: '44444444-4444-4444-8444-444444444444',
        fileName: data.filename,
        contentType: data.mimetype,
        sizeBytes: buffer.length,
        uploadedAt: new Date().toISOString(),
      };
    }
  );

  // 4. Binary PDF Report Response
  app.get(
    '/v1/reports/pdf',
    {
      schema: {
        operationId: 'downloadAttendancePdfReport',
        tags: ['Reports'],
        summary: 'Generate and download attendance PDF summary',
        produces: ['application/pdf'],
        response: {
          200: z.string().describe('PDF binary stream'),
          400: ValidationErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const dummyPdfContent = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', 'attachment; filename="attendance-summary.pdf"');
      return reply.send(dummyPdfContent);
    }
  );

  return app;
}
