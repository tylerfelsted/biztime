const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//Returns all invoices
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows});
    } catch(e) {
        return next(e);
    }
});

//Returns a specific invoice - Displays the company that the invoice is associated with
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const results = await db.query(`SELECT * FROM invoices JOIN companies ON invoices.comp_code=companies.code WHERE id=$1`, [id]);
        if(!results.rows[0]) {
            throw new ExpressError("Invoice not found", 404)
        }
        const { amt, paid, add_date, paid_date, code, name, description } = results.rows[0];
        return res.json({invoice: { id: Number(id), amt, paid, add_date, paid_date, company: { code, name, description}}})
    } catch(e) {
        return next(e);
    }
});

//Creates a new invoice
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});
    } catch {
        return next(e);
    }
})

//Updates an existing invoice - either the amount, or whether or not it has been paid
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        let { amt, paid } = req.body;
        paid = (paid ? true : false);
        let paid_date = (paid ? `NOW()` : null);
        const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`, [amt, paid, paid_date, id]);
        if(!results.rows[0]) {
            throw new ExpressError("Invoice not found", 404)
        }
        return res.json({invoice: results.rows[0]});
    } catch (e) {
        return next(e)
    }
})

//Deletes an invoice
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING *`, [id]);
        if(!results.rows[0]) {
            throw new ExpressError("Invoice not found", 404)
        }
        return res.json({status: "deleted"});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;