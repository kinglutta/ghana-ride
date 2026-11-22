const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    const mongod = await MongoMemoryServer.create({
        instance: { port: 27017, ip: '127.0.0.1', dbName: 'ride_local' },
    });
    console.log('LOCAL_MONGO_URI=' + mongod.getUri());
    setInterval(() => {}, 1000);
})();
