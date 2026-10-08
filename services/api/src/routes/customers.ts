import type { FastifyPluginAsync } from 'fastify';
import type { CustomerService } from '../services/customer.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';
import {
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  CreateCustomerSiteRequestSchema,
  UpdateCustomerSiteRequestSchema,
} from '@oprino/contracts';

export interface CustomerRoutesOptions {
  customerService: CustomerService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const customerRoutes: FastifyPluginAsync<CustomerRoutesOptions> = async (app, options) => {
  const { customerService, authMiddleware } = options;

  // POST /v1/customers - Create Customer
  app.post(
    '/v1/customers',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = CreateCustomerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid customer payload',
          details: parsed.error.issues,
        });
      }

      try {
        const customer = await customerService.createCustomer(req.workspaceId!, parsed.data);
        return reply.status(201).send(customer);
      } catch (err: any) {
        req.log.error(err, 'Failed to create customer');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to create customer',
        });
      }
    },
  );

  // GET /v1/customers - List Customers
  app.get(
    '/v1/customers',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { search?: string; page?: string; limit?: string };
        const result = await customerService.listCustomers(req.workspaceId!, {
          search: query.search,
          page: query.page ? Number.parseInt(query.page, 10) : undefined,
          limit: query.limit ? Number.parseInt(query.limit, 10) : undefined,
        });
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list customers');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to list customers',
        });
      }
    },
  );

  // GET /v1/customers/:id - Get Customer Details
  app.get(
    '/v1/customers/:id',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_READ),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const customer = await customerService.getCustomerById(req.workspaceId!, id);
        return reply.status(200).send(customer);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to get customer',
        });
      }
    },
  );

  // PATCH /v1/customers/:id - Update Customer
  app.patch(
    '/v1/customers/:id',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = UpdateCustomerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid update payload',
          details: parsed.error.issues,
        });
      }

      try {
        const updated = await customerService.updateCustomer(req.workspaceId!, id, parsed.data);
        return reply.status(200).send(updated);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to update customer',
        });
      }
    },
  );

  // POST /v1/customers/:customerId/sites - Create Customer Site
  app.post(
    '/v1/customers/:customerId/sites',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const { customerId } = req.params as { customerId: string };
      const parsed = CreateCustomerSiteRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid site payload',
          details: parsed.error.issues,
        });
      }

      try {
        const site = await customerService.createCustomerSite(
          req.workspaceId!,
          customerId,
          parsed.data,
        );
        return reply.status(201).send(site);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to create customer site',
        });
      }
    },
  );

  // GET /v1/customers/:customerId/sites - List Customer Sites
  app.get(
    '/v1/customers/:customerId/sites',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_READ),
      ],
    },
    async (req, reply) => {
      const { customerId } = req.params as { customerId: string };
      try {
        const result = await customerService.listCustomerSites(req.workspaceId!, customerId);
        return reply.status(200).send(result);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to list customer sites',
        });
      }
    },
  );

  // GET /v1/customers/:customerId/sites/:siteId - Get Customer Site
  app.get(
    '/v1/customers/:customerId/sites/:siteId',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_READ),
      ],
    },
    async (req, reply) => {
      const { customerId, siteId } = req.params as { customerId: string; siteId: string };
      try {
        const site = await customerService.getCustomerSiteById(
          req.workspaceId!,
          customerId,
          siteId,
        );
        return reply.status(200).send(site);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to get customer site',
        });
      }
    },
  );

  // PATCH /v1/customers/:customerId/sites/:siteId - Update Customer Site
  app.patch(
    '/v1/customers/:customerId/sites/:siteId',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const { customerId, siteId } = req.params as { customerId: string; siteId: string };
      const parsed = UpdateCustomerSiteRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid update payload',
          details: parsed.error.issues,
        });
      }

      try {
        const updated = await customerService.updateCustomerSite(
          req.workspaceId!,
          customerId,
          siteId,
          parsed.data,
        );
        return reply.status(200).send(updated);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to update customer site',
        });
      }
    },
  );
};
