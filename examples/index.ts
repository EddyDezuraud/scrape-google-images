import { scrapeImages } from '../index';

//node js api with express to get lib pick elements
import express from 'express';

const app = express();

app.get('/', async (req: express.Request, res: express.Response) => {

    if(!req.query.q) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const results = await scrapeImages(req.query.q as string);
    res.json(results);
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

export { app };