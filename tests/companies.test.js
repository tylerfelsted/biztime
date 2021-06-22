process.env.NODE_ENV = "test";

const request = require('supertest');

const db = require('../db')
const app = require('../app.js');

let companyArray
let testCompany;
let testInvoice;

beforeEach(async () => {
    const companyRes = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('test', 'Test Company', 'This company is a test company')
        RETURNING *`);
    const invoiceRes = await db.query(`
        INSERT INTO invoices (comp_code, amt) 
        VALUES ('test', 1000)
        RETURNING *`);
    const { code, name, description } = companyRes.rows[0];
    const {id, comp_code, amt, paid, add_date, paid_date} = invoiceRes.rows[0];
    companyArray = companyRes.rows;
    testCompany = {code, name, description, invoices: [{id, comp_code, amt, paid, add_date: add_date.toISOString(), paid_date}]};
    testInvoice = {id, comp_code, amt, paid, add_date: String(add_date), paid_date, company: companyRes.rows[0]}

})

describe('GET /companies', () => {
    test("returns an array of companies", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({companies: companyArray})
    })
})

describe('GET /companies/[code]', () => {
    test("returns the company specified, and includes any invoices", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({company: testCompany});
    })
    test("returns 404 if there is no company", async () => {
        const res = await request(app).get('/companies/badcode');
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /companies', () => {
    test("creates a new company and returns it", async () => {
        const res = await request(app).post('/companies').send({code: 'test2', name: 'Test Company 2', description: 'This is the second test company'});
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({company: {code: 'test2', name: 'Test Company 2', description: 'This is the second test company'}})
    })
})

describe('PUT /companies/[code]', () => {
    test("Updates a company with new information and returns it", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({name: 'New Name', description: 'This is a new description'});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({company: {code: testCompany.code, name: 'New Name', description: 'This is a new description'}});
    })
    test("Returns 404 if there is no company", async () => {
        const res = await request(app).put('/companies/badcode')
        expect(res.statusCode).toBe(404);
    })
})

describe('DELETE /companies/[code]', () => {
    test("Deletes a company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: 'deleted'})
    })
    test("Returns 404 if there is no company", async () => {
        const res = await request(app).delete('/companies/badcode');
        expect(res.statusCode).toBe(404);
    })
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`)
})

afterAll(async () => {
    await db.end();
})