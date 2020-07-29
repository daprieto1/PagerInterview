'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../server');
let server;

// test shortcuts
const lab = exports.lab = Lab.script();
const { describe, before, after } = lab;
const expect = Code.expect;
const it = lab.it;

// test data
const mockLocations = [
    {   
        locationId: 1,
        name: 'Diego\'s Grocerys',
        latitude: 40.730610,
        longitude: -73.935242
    }, 
    {   
        locationId: 2,
        name: 'Carlos\'s Super Market',
        latitude: 40.730610,
        longitude: -73.935243
    },
    {   
        locationId: 3,
        name: 'Miguel\'s Späti',
        latitude: 40.730610,
        longitude: -73.935244
    },
    {   
        locationId: 4,
        name: 'Food Heaven',
        latitude: 40.730611,
        longitude: -73.935245
    },
    {   
        locationId: 5,
        name: 'Pared Mercado',
        latitude: 40.730612,
        longitude: -73.935246
    }
];

const mockItems = [
    {
        locationId: 1,
        itemId: 20,
        name: 'LCHARM1',
        description: 'Lucky Charm 11.5 oz', 
        stock: 10, 
        category: 'CEREAL',
        price: 5.23
    },
    {
        locationId: 1,
        itemId: 21,
        name: 'MILK1',
        description: 'Milk 1 gal', 
        stock: 5, 
        category: 'DAIRY',
        price: 2.99
    },
    {
        locationId: 1,
        itemId: 22,
        name: 'CHOC BAR',
        description: 'Chocolate bar 250 gr.', 
        stock: 20, 
        category: 'CANDY',
        price: 8
    },
    {
        locationId: 2,
        itemId: 23,
        name: 'DIAPERS',
        description: 'Diapers bag 6 units', 
        stock: 80, 
        category: 'BABY',
        price: 8
    }
]

async function cleanDatabase(db) {
    
    await db.collection('locations').deleteMany({});
    await db.collection('items').deleteMany({});
    await db.collection('orders').deleteMany({});
}

describe('Local Grocery API', () => {

    before(async () => {

        server = await Server.init();
        const db = server.app.db;

        // clean DB
        await cleanDatabase(db);

        // insert test data
        await db.collection('locations').insertMany(mockLocations);
        await db.collection('items').insertMany(mockItems);
    });

    after(async () => {

        if (!server) {
          return;
        }
    
        await server.stop();
    });

    it('returns all locations: GET /locations/', async () => {

        const response = await server.inject({
            method: 'GET',
            url: '/locations'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal(mockLocations);
    });

     it('returns items sold in a location: GET /locations/{locationId}/items', async () => {

         const response = await server.inject({
             method: 'GET',
             url: '/locations/1/items'
         });

         const locationItems = mockItems.filter((i) => i.locationId === 1);

         expect(response.statusCode).to.equal(200);
         expect(response.result).to.equal(locationItems);
     });

     it('returns empty when no items in a location: GET /locations/{locationId}/items', async () => {

         const response = await server.inject({
             method: 'GET',
             url: '/locations/3/items'
         });

         expect(response.statusCode).to.equal(200);
         expect(response.result).to.equal([]);
     });

     it('returns 404 when location not found: GET /locations/{locationId}/items', async () => {

         const response = await server.inject({
             method: 'GET',
             url: '/locations/9999/items'
         });

         expect(response.statusCode).to.equal(404);
     });

     it('returns a created order: POST /locations/{locationId}/order', async () => {

         const db = server.app.db;
         const ordersCollection = db.collection('orders');

         const response = await server.inject({
             method: 'POST',
             url: '/locations/1/order',
             payload: {
                 customerId: 787,
                 items: [{
                     itemId: 20,
                     quantity: 1
                 },
                 {
                     itemId: 21,
                     quantity: 5
                 }]
             }
         });

         expect(response.statusCode).to.equal(201);

         delete response.result._id;
         const savedOrder = await ordersCollection.findOne({ customerId: 787 });

         expect(savedOrder).to.exist();
         expect(response.result).to.equal({
             customerId: 787,
             items: [{
                 itemId: 20,
                 quantity: 1
             },
             {
                 itemId: 21,
                 quantity: 5
             }],
             total: 20.18
         });
     });
});
