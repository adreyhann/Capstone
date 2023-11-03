const router = require('express').Router();

router.get('/', (req, res, next) => {
    res.render('auth/login');
})



module.exports = router;