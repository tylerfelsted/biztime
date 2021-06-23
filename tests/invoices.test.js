process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;
let invoiceArray;

beforeEach(async () => {
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM companies`);
    const companyRes = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('test2', 'Test Company 2', 'This company is a test company')
        RETURNING *`);
    const invoiceRes = await db.query(`
        INSERT INTO invoices (comp_code, amt) 
        VALUES ('test2', 1000)
        RETURNING *`);
    const { code, name, description } = companyRes.rows[0];
    const {id, comp_code, amt, paid, add_date, paid_date} = invoiceRes.rows[0];
    invoiceArray = [{id, comp_code, amt, paid, add_date: add_date.toISOString(), paid_date}];
    testInvoice = {id, amt, paid, add_date: add_date.toISOString(), paid_date, company: companyRes.rows[0]}
})

describe("GET /invoices", () => {
    test("Should return an array of invoices", async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoices: invoiceArray});
    })
})

describe("GET /invoices/[id]", () => {
    test("Should return one invoice based on the id", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: testInvoice});
    })
    test("Should return 404 if no invoice is found", async () => {
        const res = await request(app).get('/invoices/10000');
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /invoices", () => {
    test("Should create a new invoice and return it", async () => {
        const res = await request(app).post('/invoices').send({comp_code: 'test2', amt: 1000});
        expect(res.statusCode).toBe(201);
    })
})

describe("PUT /invoices/[id]", () => {
    test("Should update an existing invoice based on id and return it", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({amt: 2000});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: {id: testInvoice.id, comp_code: 'test2', amt: 2000, paid: testInvoice.paid, add_date: testInvoice.add_date, paid_date: testInvoice.paid_date}})
    })

    test("SHould return 404 if no invoice is found", async () => {
        const res = await request(app).put('/invoices/10000');
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /invoices/[id]", () => {
    test("Should delete an invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"})
    })
    test("Should return 404 if no invoice is found", async () => {
        const res = await request(app).delete('/invoices/10000');
        expect(res.statusCode).toBe(404);
    })
})

afterEach(async () => {
    // await db.query(`DELETE FROM companies`);
    // await db.query(`DELETE FROM invoices`);
})

afterAll(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
    await db.end();
})
