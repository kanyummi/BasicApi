const advancedResults = (model, populate) => async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        //Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($ge, $gte, $le, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Find resource
        query = model.find(JSON.parse(queryStr));

        // SELECT FIELDS
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // SORT 
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // PAGINATION
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await model.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        // Populate 
        if(populate) {
            query = query.populate(populate);
        }

        // Excecute query
        const results = await query;

        // Pagination Result
        const pagination = {}

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }
        if (startIndex > 0) {
            pagination.pre = {
                page: page - 1,
                limit
            }
        }
        res.advancedResults = {
            success: true,
            count: results.length,
            pagination,
            data: results,
        }
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = advancedResults;