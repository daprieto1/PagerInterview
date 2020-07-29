const Hapi = require('@hapi/hapi');
const MongoClient = require('mongodb').MongoClient;

const server = Hapi.server({
    port: 3000,
    debug: {
        request: ['*']
    }
});

const routes = [
    {
        method: 'GET',
        path: '/locations',
        handler: async (request, h) => {

            const db = server.app.db;
            const locationCollection = db.collection('locations');

            // query all locations
            const documents = await locationCollection.find({}).toArray();
            return documents;
        }
    },

    {
        method:'GET',
        path:'/locations/{id}/items',
        handler: async (request, h) => {
            const paramLocationId = parseInt(request.params.id);
            const db = server.app.db;
            const itemsCollection = db.collection('items');
            const locationCollection = db.collection('locations');

            //query items by location 
            const location = await locationCollection.find({'locationId':paramLocationId}).toArray();                    
            const items = await itemsCollection.find({'locationId':paramLocationId}).toArray();

            console.log(location);
            const status = location.length > 0 ? 200 : 404;

            return h.response(items).code(status);
        }
    },

    {
        method: 'POST',
        path:'/locations/{id}/order',
        handler: async (request, h) => {
            const order = request.payload;
            
            order.total=0;

            const db = server.app.db;
            const itemsCollection = db.collection('items');
            const ordersCollection = db.collection('orders');
            
            for(const item of order.items){
                console.log('==>' + item)
                const dbItem = await itemsCollection.findOne({'itemId':item.itemId});
                order.total += (item.quantity * dbItem.price);
            }

            await ordersCollection.insertOne(order);           

            return h.response(order).code(201);

        }
    }
];

const init = async () => {
    
    // connect to DB
    const url = 'mongodb://localhost:27017/local-grocery-store';
    const client = new MongoClient(url, {  useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    
    const db = client.db();
    server.app.db = db;
    
    console.log("Connected successfully to mongo");

    // routes configuration
    server.route(routes);

    try {
        if (!module.parent) {
            await server.start();
        } 
        else {
            await server.initialize();
        }
        return server;
    } 
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

void async function () {
    if (!module.parent) {
        await init();
    }
}();

module.exports = {
    init
}

