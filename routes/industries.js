const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//Displays all industries
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM industries');
        return res.json({industries: results.rows});
    } catch(e) {
        return next(e);
    }
})

//Returns a specifc industry - displays all associated companies with that industry
router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT i.code AS industry_code, i.industry, c.code AS comp_code, c.name, c.description 
                                        FROM industries AS i 
                                        JOIN companies_industries AS ci 
                                        ON i.code=ci.industry_code 
                                        JOIN companies AS c 
                                        ON ci.comp_code = c.code 
                                        WHERE i.code=$1;`, 
                                        [code]);
        if(!results.rows[0]) {
            throw new ExpressError("Industry not found", 404)
        }
        const { industry_code, industry } = results.rows[0];
        const companiesArray = results.rows.map((r) => {
            const { comp_code, name, description } = r;
            return { comp_code, name, description };
        });
        return res.json({industry: {industry_code, industry, companies: companiesArray}});
    } catch(e) {
        return next(e);
    }
})

//Creates a new industry
router.post('/', async (req, res, next) => {
    try{
        const {code, industry} = req.body;
        const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`, [code, industry]);
        return res.json({industry: results.rows[0]});
    } catch(e) {
        return next(e);
    }
})

//Associates a company with an industry
router.post('/:code', async (req, res, next) => {
    try{
        const industry_code = req.params.code;
        const comp_code = req.body.code;
        const results = await db.query(`INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2)`, [comp_code, industry_code]);
        return res.json({status: "Company added"});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;