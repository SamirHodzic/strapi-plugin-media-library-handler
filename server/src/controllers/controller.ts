import type { Core } from '@strapi/strapi';
import { yup } from '@strapi/utils';
const { createCoreController } = require('@strapi/strapi').factories;

// Validation schemas
const folderNameSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(1, 'Name cannot be empty'),
});
const folderIdSchema = yup.object({
  id: yup
    .number()
    .required('Folder ID is required')
    .positive('Folder ID must be a positive number'),
});
const updateFolderSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(1, 'Name cannot be empty'),
  parentId: yup.number(),
});
const fileIdSchema = yup.object({
  id: yup
    .number()
    .required('File ID is required')
    .positive('File ID must be a positive number'),
});

// Helper: build nested parent populate up to given depth
const buildParentPopulate = (depth: number): any =>
  depth <= 1 ? true : { populate: { parent: buildParentPopulate(depth - 1) } };

export default createCoreController(
  'plugin::upload.folder',
  ({ strapi }: { strapi: Core.Strapi }) => {
    // Services
    const uploadSvc = strapi.plugins.upload.services.upload;
    const folderSvc = strapi.plugins.upload.services.folder;
    const fileSvc = strapi.plugins.upload.services.file;

    // Utility to get or create API user
    const getApiUser = async () => {
      let user = await strapi
        .query('admin::user')
        .findOne({ where: { username: 'API USER' } });
      if (!user) {
        user = await strapi.query('admin::user').create({
          data: { username: 'API USER', isActive: true, roles: ['1'] },
        });
      }
      return user;
    };

    return {
      // Create a new folder
      async createFolder(ctx) {
        try {
          const payload = normalizeBody(ctx.request.body);
          await folderNameSchema.validate(payload);
          const { name, parentId = null } = payload;

          const folder = await folderSvc.create({ name, parent: parentId });
          ctx.body = folder;
        } catch (error) {
          ctx.throw(400, error);
        }
      },

      // Retrieve folders with optional sorting and search
      async getFolders(ctx) {
        try {
          const { parentId = null, sort, _q: _q = '' } = ctx.request.query;
          const baseOptions: any = {
            where: { parent: parentId },
            _q,
            populate: { children: { count: true }, files: { count: true } },
          };

          if (sort) {
            baseOptions.orderBy = (Array.isArray(sort) ? sort : [sort]).map(
              (item: string) => {
                const [field, order = 'asc'] = item.split(':');
                return { [field]: order };
              }
            );
          }

          ctx.body = await strapi
            .query('plugin::upload.folder')
            .findMany(baseOptions);
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Get a single folder by ID, including recursive parents
      async getFolder(ctx) {
        try {
          const id = Number(ctx.params.id);
          await folderIdSchema.validate({ id });

          const folder = await strapi.query('plugin::upload.folder').findOne({
            where: { id },
            populate: {
              parent: buildParentPopulate(5),
              children: { count: true },
              files: { count: true },
            },
          });

          if (!folder) ctx.throw(404, 'Folder not found');
          ctx.body = folder;
        } catch (error) {
          ctx.throw(error.status || 400, error);
        }
      },

      // Update folder details
      async updateFolder(ctx) {
        try {
          const id = Number(ctx.params.id);
          await folderIdSchema.validate({ id });

          const payload = normalizeBody(ctx.request.body);
          await updateFolderSchema.validate(payload);
          const { name, parentId = null } = payload;

          const existing = await strapi
            .query('plugin::upload.folder')
            .findOne({ where: { id } });
          if (!existing) ctx.throw(404, 'Folder not found');

          const user = await getApiUser();
          const updated = await folderSvc.update(
            id,
            { name, parent: parentId },
            { user: { id: user.id } }
          );
          ctx.body = updated;
        } catch (error) {
          ctx.throw(error.status || 400, error);
        }
      },

      // Delete a single folder by ID
      async deleteFolder(ctx) {
        try {
          const id = Number(ctx.params.id);
          await folderIdSchema.validate({ id });

          const deleted = await folderSvc.deleteByIds(id);
          ctx.body = deleted;
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Bulk delete folders and files
      async bulkDelete(ctx) {
        try {
          const payload = normalizeBody(ctx.request.body);
          let { fileIds = [], folderIds = [] } = payload;

          if (!Array.isArray(fileIds) || !Array.isArray(folderIds)) {
            ctx.throw(
              400,
              'Invalid parameters: fileIds and folderIds must be arrays'
            );
          }
          if (fileIds.length === 0 && folderIds.length === 0) {
            ctx.throw(
              400,
              'Invalid parameters: provide at least one fileId or folderId'
            );
          }

          const deletedFiles = fileIds.length
            ? await fileSvc.deleteByIds(fileIds)
            : [];
          const deletedFolders = folderIds.length
            ? await folderSvc.deleteByIds(folderIds)
            : [];
          ctx.body = { deletedFiles, deletedFolders };
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Bulk move files and folders
      async bulkMove(ctx) {
        try {
          const payload = normalizeBody(ctx.request.body);
          let { fileIds = [], folderIds = [], targetFolderId } = payload;

          if (!Array.isArray(fileIds) || !Array.isArray(folderIds)) {
            ctx.throw(
              400,
              'Invalid parameters: fileIds and folderIds must be arrays'
            );
          }
          if (fileIds.length === 0 && folderIds.length === 0) {
            ctx.throw(
              400,
              'Invalid parameters: provide at least one fileId or folderId'
            );
          }

          const user = await getApiUser();
          const movedFiles = await Promise.all(
            fileIds.map((id) =>
              uploadSvc.updateFileInfo(id, { folder: targetFolderId })
            )
          );
          const movedFolders = await Promise.all(
            folderIds.map((id) =>
              folderSvc.update(
                id,
                { parent: targetFolderId },
                { user: { id: user.id } }
              )
            )
          );
          ctx.body = { movedFiles, movedFolders };
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Retrieve full folder structure
      async getFolderStructure(ctx) {
        try {
          const structure = await folderSvc.getStructure();
          ctx.body = structure;
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Upload media into a folder
      async uploadFile(ctx) {
        try {
          const fileObj = ctx.request.files?.file;
          if (!fileObj) ctx.throw(400, 'No file provided');

          const payload = normalizeBody(ctx.request.body);
          const { folderId, alternativeText, caption } = payload;
          const data = {
            fileInfo: {
              name: fileObj.originalFilename,
              folder: folderId,
              alternativeText,
              caption,
            },
          };

          const result = await uploadSvc.upload({ data, files: fileObj });
          ctx.body = { data: result };
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Update media metadata
      async updateFile(ctx) {
        try {
          const id = Number(ctx.params.id);
          await fileIdSchema.validate({ id });

          const payload = normalizeBody(ctx.request.body);
          const { name, alternativeText, caption, folderId } = payload;
          const updated = await uploadSvc.updateFileInfo(id, {
            name,
            folder: folderId,
            alternativeText,
            caption,
          });
          ctx.body = { data: updated };
        } catch (error) {
          ctx.throw(500, error);
        }
      },

      // Get media file info
      async getFile(ctx) {
        try {
          const id = Number(ctx.params.id);
          await fileIdSchema.validate({ id });

          const folder = await strapi.query('plugin::upload.file').findOne({
            where: { id },
          });
          ctx.body = { data: folder };
        } catch (error) {
          ctx.throw(error.status || 400, error);
        }
      },

      // Delete a single file by ID
      async deleteFile(ctx) {
        try {
          const id = Number(ctx.params.id);
          await fileIdSchema.validate({ id });

          const deleted = await fileSvc.deleteByIds(id);
          ctx.body = deleted;
        } catch (error) {
          ctx.throw(500, error);
        }
      },
    };
  }
);

function normalizeBody(raw: any): Record<string, any> {
  let body = raw;
  // 1) if form‑data, our fields are under `raw.fields`
  if (body && typeof body === 'object' && 'fields' in body) {
    body = (body as any).fields;
  }
  // 2) if still a string, try parsing JSON
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // swallow — we'll let validation catch it if it's invalid JSON
    }
  }
  return body;
}
