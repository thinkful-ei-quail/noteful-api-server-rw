const express = require('express');
const FoldersService = require('./folders-service');
const path = require('path');
const xss = require('xss');

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
    id: folder.id, 
    folder_name: xss(folder.folder_name)
});

foldersRouter 
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(
            req.app.get('db')
        )
            .then(folders => {
                res.json(folders.map(serializeFolder));
            })
            .catch(next);
    }) 
    .post(jsonParser, (req, res, next) => {
        const {folder_name: newFolderName} = req.body;
        const newFolder = {folder_name: newFolderName};

        for (const [key, value] of Object.entries(newFolder)) {
            if (value == null) {
                return res.status(400).json({
                    error: {message: `Missing '${key}' in request body.`}
                });
            }
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(serializeFolder(folder));
            })
            .catch(next);
    });

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getFolderById (
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if (!folder) {
                    return res.status(404).json({
                        error: {message: `Folder does not exist.`}
                    });
                }

                res.folder = folder;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(res.folder);
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(() => {
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const {folder_name} = req.body;
        const folderToUpdate = {folder_name};

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;

        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {message: `Request body must contain a 'name.'`}
            });
        }

        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            folderToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = foldersRouter;