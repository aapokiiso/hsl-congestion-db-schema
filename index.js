'use strict';

const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');

function initConnection(dbConfig) {
    return new Sequelize(
        dbConfig.name,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
            operatorsAliases: Sequelize.Op,
            logging: dbConfig.logging,
            dialectOptions: {
                socketPath: dbConfig.socketPath,
            },
            sync: {
                force: dbConfig.forceSync,
            },
        },
    );
}

function importModels(sequelize) {
    const modelsDir = path.resolve(__dirname, 'model');

    const fileNames = getFileNames(modelsDir);

    const models = fileNames
        .filter(fileName => !isHiddenFile(fileName))
        .map(importModel)
        .reduce((models, model) => {
            models[model.name] = model;

            return models;
        }, {});

    Object.keys(models)
        .forEach(modelName => {
            if (typeof models[modelName].associate === 'function') {
                models[modelName].associate(models);
            }
        });

    function getFileNames(dir) {
        return fs.readdirSync(dir);
    }

    function isHiddenFile(fileName) {
        // Skip '.' and '..'

        return fileName.indexOf('.') === 0;
    }

    function importModel(fileName) {
        return sequelize.import(path.join(modelsDir, fileName));
    }
}

let dbInstance;

module.exports = function initDbInstance(dbConfig) {
    if (!dbInstance) {
        dbInstance = initConnection(dbConfig);
        importModels(dbInstance);
        dbInstance.sync();
    }

    return dbInstance;
};
