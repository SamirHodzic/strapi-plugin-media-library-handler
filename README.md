# strapi-plugin-media-library-handler

> Plugin for handling media library (dirs/files manipulation) through api in Strapi.

---

## Features

- Manage folders and files through API.
- Easy integration with Strapi projects.

## Installation
```bash
npm i strapi-plugin-media-library-handler
```

## Compatibility

Plugin is compatible with Strapi `5.0.0` and above.

## Configuration
No additional configuration needed, the plugin is automatically enabled after installation.


## Media & Folder Management API

* [Folders](#folders)
  * [Create Folder](#create-folder)
  * [List Folders](#list-folders)
  * [Get Folder](#get-folder)
  * [Update Folder](#update-folder)
  * [Delete Folder](#delete-folder)
  * [Bulk Delete](#bulk-delete)
  * [Bulk Move](#bulk-move)
  * [Get Folder Structure](#get-folder-structure)
* [Media Files](#media-files)
  * [Upload Media File](#upload-media-file)
  * [Update Media File](#update-media-file)
  * [Get Media File](#get-media-file)
  * [Delete Media File](#delete-media-file)
* [Error Handling](#error-handling)

## Folders

### Create Folder

Create a new folder.

```
POST {STRAPI_BASE_URL}/api/media/folders
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "My New Folder",
  "parentId": 123
}
```

**Response** (201)

```json
{
  "id": 456,
  "name": "My New Folder",
  "parent": null,
  "createdAt": "2025-05-05T12:34:56.789Z",
  ...
}
```

**Errors**

* `400 Bad Request` – validation failed.
* `500 Internal Server Error` – unexpected error.

### List Folders

Retrieve folders, with optional search and sorting.

```
GET {STRAPI_BASE_URL}/api/media/folders?parentId=123&_q=term&sort=name:asc&sort=createdAt:desc
```

**Query Parameters**

* `parentId` (integer) — optional, filter by parent folder (omit or null for root)
* `_q` (string) — optional, full-text search string
* `sort` (string) — optional, repeatable. Format: `field:asc|desc`.

**Response** (200)

```json
[
  {
    "id": 123,
    "name": "Root Folder",
    "children": { "count": 2 },
    "files":    { "count": 5 },
    ...
  }
]
```

### Get Folder

Get a specific folder by its ID, including nested parents up to 5 levels.

```
GET {STRAPI_BASE_URL}/api/media/folders/:id
```

**Path Parameter**

* `id` (integer) — required, positive folder ID.

**Response** (200)

```json
{
  "id": 123,
  "name": "Nested Folder",
  "parent": {
    "id": 50,
    "name": "Parent 1",
    "parent": {
      "id": 10,
      "name": "Parent 2"
      ...
    }
  },
  "children": { "count": 0 },
  "files":    { "count": 3 },
  ...
}
```

**Errors**

* `400 Bad Request` – invalid or missing ID.
* `404 Not Found` – folder not found.

### Update Folder

Update an existing folder’s name and/or parent.

```
PUT {STRAPI_BASE_URL}/api/media/folders/:id
Content-Type: application/json
```

**Path Parameter**

* `id` (integer) — required.

**Request Body**

```json
{
  "name": "Renamed Folder",
  "parentId": 999          
}
```

**Response** (200)

```json
{
  "id": 123,
  "name": "Renamed Folder",
  "parent": 999,
  ...
}
```

**Errors**

* `400 Bad Request` – validation failure.
* `404 Not Found` – folder doesn’t exist.

### Delete Folder

Delete a single folder.

```
DELETE {STRAPI_BASE_URL}/api/media/folders/:id
```

**Path Parameter**

* `id` (integer) — required.

**Response** (200)

```json
[
  {
    "id": 123,
    "name": "Deleted Folder",
    ...
  }
]
```

### Bulk Delete

Delete multiple files and folders in one call.

```
POST {STRAPI_BASE_URL}/api/media/bulk-delete
Content-Type: application/json
```

**Request Body**

```json
{
  "fileIds":   [1, 2, 3],
  "folderIds": [10, 11, 12]
}
```

**Response** (200)

```json
{
  "deletedFiles":   [ { ... } ],
  "deletedFolders": [ { ... }]
}
```

### Bulk Move

Move multiple files and folders to a target folder.

```
POST {STRAPI_BASE_URL}/api/media/bulk-move
Content-Type: application/json
```

**Request Body**

```json
{
  "fileIds":        [1, 2, 3],
  "folderIds":      [10, 11, 12],
  "targetFolderId": 99           
}
```

**Response** (200)

```json
{
  "movedFiles":   [ { ... } ],
  "movedFolders": [ { ... } ]
}
```

### Get Folder Structure

Retrieve the entire nested folder tree.

```
GET {STRAPI_BASE_URL}/api/media/folders-structure
```

**Response** (200)

```json
[
  {
    "id": 1,
    "name": "Root",
    "children": [
      { "id": 2, "name": "Child A", "children": [ { ... } ] },
      ...
    ]
  }
]
```

## Media Files

### Upload Media File

Upload a file to a folder.

```
POST {STRAPI_BASE_URL}/api/media/files
Content-Type: multipart/form-data
```

**Form Data**

* `file` (file) — required.
* `folderId` (integer) — optional.
* `alternativeText` (string) — optional.
* `caption` (string) — optional.

**Response** (200)

```json
{
  "data": [
    {
      "id": 321,
      "name": "image.png",
      "url": "/uploads/image.png",
      "folder": 99,
      ...
    }
  ]
}
```

### Update Media File

Update file metadata (name, alt text, caption, or folder).

```
POST {STRAPI_BASE_URL}/api/media/files/:id
Content-Type: application/json
```

**Path Parameter**

* `id` (integer) — required.

**Request Body**

```json
{
  "name":            "newname.png",
  "alternativeText": "An example", 
  "caption":         "Caption text",
  "folderId":        99             
}
```

**Response** (200)

```json
{
  "data": {
    "id": 321,
    "name": "newname.png",
    "alternativeText": "An example",
    "caption": "Caption text",
    "folder": 99,
    ...
  }
}
```

### Get Media File

Get file metadata (name, alt text, caption, folder, etc).

```
GET {STRAPI_BASE_URL}/api/media/files/:id
Content-Type: application/json
```

**Path Parameter**

* `id` (integer) — required.

**Response** (200)

```json
{
  "data": {
    "id": 321,
    "name": "newname.png",
    "alternativeText": "An example",
    "caption": "Caption text",
    "folder": 99,
    "formats": {
      ...
    }
    ...
  }
}
```

### Delete Media File

Delete a single media file.

```
DELETE {STRAPI_BASE_URL}/api/media/files/:id
```

**Path Parameter**

* `id` (integer) — required.

**Response** (200)

```json
[
  {
    "id": 123,
    "name": "Deleted File",
    ...
  }
]
```

## Error Handling

* **400 Bad Request**: validation errors, missing/invalid params.
* **404 Not Found**: resource not found.
* **500 Internal Server Error**: unexpected server error.


## License

This project is licensed under the [MIT](./LICENSE).
