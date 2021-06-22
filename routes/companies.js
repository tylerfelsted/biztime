const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//Returns all companies in the database
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows});
    } catch(e) {
        return next(e)
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT * FROM companies JOIN invoices ON companies.code=invoices.comp_code WHERE code=$1`, [code])
        if(!results.rows[0]){
            throw new ExpressError("Company not found", 404);
        }
        const { name, description } = results.rows[0];
        const invoiceArray = [];
        for(row of results.rows) {
            const { id, comp_code, amt, paid, add_date, paid_date } = row;
            invoiceArray.push({ id, comp_code, amt, paid, add_date, paid_date });
        }
        return res.json({company: {code, name, description, invoices: invoiceArray }});
    } catch(e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
        return res.status(201).json({company: results.rows[0]})
    } catch(e) {
        return next(e);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description} = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`, [name, description, code]);
        if(!results.rows[0]){
            throw new ExpressError("Company not found", 404);
        }
        return res.json({company: results.rows[0]});
    } catch(e) {
        return next(e)
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING *`, [code]);
        if(!results.rows[0]){
            throw new ExpressError("Company not found", 404);
        }
        return res.json({status: "deleted"});
    } catch(e) {
        return next(e);
    }
    
});

module.exports = router;