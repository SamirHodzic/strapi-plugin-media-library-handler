const routes = {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'POST',
        path: '/folders',
        handler: 'controller.createFolder',
        config: {},
      },
      {
        method: 'GET',
        path: '/folders',
        handler: 'controller.getFolders',
        config: {},
      },
      {
        method: 'GET',
        path: '/folders/:id',
        handler: 'controller.getFolder',
        config: {},
      },
      {
        method: 'PUT',
        path: '/folders/:id',
        handler: 'controller.updateFolder',
        config: {},
      },
      {
        method: 'DELETE',
        path: '/folders/:id',
        handler: 'controller.deleteFolder',
        config: {},
      },
      {
        method: 'GET',
        path: '/folders-structure',
        handler: 'controller.getFolderStructure',
        config: {},
      },
      {
        method: 'POST',
        path: '/bulk-delete',
        handler: 'controller.bulkDelete',
        config: {},
      },
      {
        method: 'PUT',
        path: '/bulk-move',
        handler: 'controller.bulkMove',
        config: {},
      },
      {
        method: 'GET',
        path: '/files/:id',
        handler: 'controller.getFile',
        config: {},
      },
      {
        method: 'POST',
        path: '/files',
        handler: 'controller.uploadFile',
        config: {},
      },
      {
        method: 'PUT',
        path: '/files/:id',
        handler: 'controller.updateFile',
        config: {},
      },
      {
        method: 'DELETE',
        path: '/files/:id',
        handler: 'controller.deleteFile',
        config: {},
      },
    ],
  },
};

export default routes;
